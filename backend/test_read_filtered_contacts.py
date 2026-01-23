"""
Test script to read filtered contacts from the database.
This script reads all campaigns and displays their filtered contacts.
"""

import sqlite3
import json
import os
from typing import List, Dict, Any

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), 'campaigns.db')

def get_db_connection():
    """Get a database connection"""
    if not os.path.exists(DB_PATH):
        print(f"Error: Database file not found at {DB_PATH}")
        return None
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def parse_contacts(contacts_str: str) -> List[Dict[str, Any]]:
    """Parse contacts JSON string, handling potential double serialization"""
    if not contacts_str:
        return []
    
    try:
        # Try parsing once
        contacts = json.loads(contacts_str)
        
        # Handle double serialization (if contacts is still a string)
        if isinstance(contacts, str):
            contacts = json.loads(contacts)
        
        # Ensure it's a list
        if isinstance(contacts, list):
            return contacts
        else:
            print(f"Warning: Contacts is not a list: {type(contacts)}")
            return []
    except json.JSONDecodeError as e:
        print(f"Error parsing contacts JSON: {e}")
        return []

def get_all_campaigns_with_contacts():
    """Get all campaigns with their filtered contacts"""
    conn = get_db_connection()
    if not conn:
        return []
    
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, name, created_at, user_id, contacts, status, executed
        FROM campaigns
        WHERE contacts IS NOT NULL AND contacts != ''
        ORDER BY created_at DESC
    ''')
    
    rows = cursor.fetchall()
    conn.close()
    
    campaigns = []
    for row in rows:
        contacts = parse_contacts(row['contacts'])
        campaigns.append({
            'campaign_id': row['id'],
            'name': row['name'],
            'created_at': row['created_at'],
            'user_id': row['user_id'],
            'status': row['status'],
            'executed': bool(row['executed']),
            'contacts_count': len(contacts),
            'contacts': contacts
        })
    
    return campaigns

def display_contact(contact: Dict[str, Any], index: int):
    """Display a single contact in a readable format"""
    print(f"\n  Contact #{index + 1}:")
    print(f"    Name: {contact.get('name', 'Unknown')}")
    print(f"    Email: {contact.get('email', 'N/A')}")
    print(f"    Title: {contact.get('title', 'N/A')}")
    print(f"    Organization: {contact.get('organization_name', 'N/A')}")
    print(f"    Location: {contact.get('city', 'N/A')}, {contact.get('country', 'N/A')}")
    print(f"    LinkedIn: {contact.get('linkedin_url', 'N/A')}")
    if contact.get('id'):
        print(f"    ID: {contact.get('id')}")

def display_campaign(campaign: Dict[str, Any]):
    """Display campaign information and its filtered contacts"""
    print("\n" + "=" * 80)
    print(f"Campaign: {campaign['name']}")
    print(f"Campaign ID: {campaign['campaign_id']}")
    print(f"User ID: {campaign['user_id']}")
    print(f"Created: {campaign['created_at']}")
    print(f"Status: {campaign['status']}")
    print(f"Executed: {campaign['executed']}")
    print(f"Filtered Contacts Count: {campaign['contacts_count']}")
    print("-" * 80)
    
    if campaign['contacts']:
        print("\nFiltered Contacts:")
        for idx, contact in enumerate(campaign['contacts']):
            display_contact(contact, idx)
    else:
        print("\nNo contacts found (empty list)")

def get_latest_campaign():
    """Get only the most recent campaign with contacts"""
    conn = get_db_connection()
    if not conn:
        return None
    
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, name, created_at, user_id, contacts, status, executed
        FROM campaigns
        WHERE contacts IS NOT NULL AND contacts != ''
        ORDER BY created_at DESC
        LIMIT 1
    ''')
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    contacts = parse_contacts(row['contacts'])
    return {
        'campaign_id': row['id'],
        'name': row['name'],
        'created_at': row['created_at'],
        'user_id': row['user_id'],
        'status': row['status'],
        'executed': bool(row['executed']),
        'contacts_count': len(contacts),
        'contacts': contacts
    }


def main():
    """Main function to read and display filtered contacts"""
    import sys
    
    # Check for --latest flag
    show_latest_only = '--latest' in sys.argv or '-l' in sys.argv
    
    print("=" * 80)
    if show_latest_only:
        print("Reading LATEST Campaign's Filtered Contacts")
    else:
        print("Reading ALL Filtered Contacts from Database")
        print("(Use --latest or -l to show only the most recent campaign)")
    print("=" * 80)
    
    if show_latest_only:
        campaign = get_latest_campaign()
        if not campaign:
            print("\nNo campaigns with filtered contacts found in the database.")
            return
        
        print(f"\nLatest campaign with contacts:")
        display_campaign(campaign)
        
        # Export latest only
        export_file = os.path.join(os.path.dirname(__file__), 'latest_campaign_export.json')
        try:
            with open(export_file, 'w', encoding='utf-8') as f:
                json.dump(campaign, f, indent=2, ensure_ascii=False)
            print(f"\nExported to: {export_file}")
        except Exception as e:
            print(f"\nCould not export to JSON: {e}")
    else:
        campaigns = get_all_campaigns_with_contacts()
        
        if not campaigns:
            print("\nNo campaigns with filtered contacts found in the database.")
            print("Make sure you have run a campaign that filters contacts.")
            return
        
        print(f"\nFound {len(campaigns)} campaign(s) with filtered contacts:\n")
        
        # Display all campaigns
        for campaign in campaigns:
            display_campaign(campaign)
        
        # Summary
        print("\n" + "=" * 80)
        print("Summary")
        print("=" * 80)
        total_contacts = sum(c['contacts_count'] for c in campaigns)
        print(f"Total campaigns with contacts: {len(campaigns)}")
        print(f"Total filtered contacts: {total_contacts}")
        print(f"Average contacts per campaign: {total_contacts / len(campaigns):.1f}" if campaigns else "N/A")
        
        # Option to export to JSON
        export_file = os.path.join(os.path.dirname(__file__), 'filtered_contacts_export.json')
        try:
            with open(export_file, 'w', encoding='utf-8') as f:
                json.dump(campaigns, f, indent=2, ensure_ascii=False)
            print(f"\nExported to: {export_file}")
        except Exception as e:
            print(f"\nCould not export to JSON: {e}")

if __name__ == "__main__":
    main()
