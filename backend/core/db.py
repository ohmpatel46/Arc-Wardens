import sqlite3
import os
from datetime import datetime, timedelta
import random

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'campaigns.db')

def init_db():
    """Initialize the database with schema and sample data"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create campaigns table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS campaigns (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            executed BOOLEAN DEFAULT 0,
            cost REAL,
            status TEXT DEFAULT 'draft'
        )
    ''')
    
    # Migrate old 'paid' column to 'executed' if it exists
    try:
        cursor.execute('ALTER TABLE campaigns ADD COLUMN executed BOOLEAN DEFAULT 0')
        cursor.execute('UPDATE campaigns SET executed = paid WHERE paid IS NOT NULL')
        # Note: SQLite doesn't support DROP COLUMN, so we'll just use 'executed' going forward
    except sqlite3.OperationalError:
        # Column already exists or migration not needed
        pass
    
    # Create analytics table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_id TEXT NOT NULL,
            emails_sent INTEGER DEFAULT 0,
            emails_opened INTEGER DEFAULT 0,
            replies INTEGER DEFAULT 0,
            bounce_rate REAL DEFAULT 0.0,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Get a database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def generate_sample_analytics(campaign_id):
    """Generate sample analytics data for a campaign"""
    # Use campaign_id as seed for consistent random data per campaign
    random.seed(hash(campaign_id) % (2**32))
    emails_sent = random.randint(500, 5000)
    emails_opened = random.randint(int(emails_sent * 0.15), int(emails_sent * 0.35))
    replies = random.randint(int(emails_opened * 0.05), int(emails_opened * 0.15))
    bounce_rate = round(random.uniform(1.0, 5.0), 1)
    return {
        'emailsSent': emails_sent,
        'emailsOpened': emails_opened,
        'replies': replies,
        'bounceRate': bounce_rate
    }

def get_all_campaigns():
    """Get all campaigns from the database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT c.*, 
               a.emails_sent, a.emails_opened, a.replies, a.bounce_rate
        FROM campaigns c
        LEFT JOIN analytics a ON c.id = a.campaign_id
        ORDER BY c.created_at DESC
    ''')
    rows = cursor.fetchall()
    conn.close()
    
    campaigns = []
    for row in rows:
        # Handle both 'paid' (old) and 'executed' (new) columns for migration
        executed = bool(row.get('executed') or row.get('paid') or False)
        
        campaign = {
            'id': row['id'],
            'name': row['name'],
            'createdAt': row['created_at'],
            'executed': executed,
            'cost': row['cost'],
            'status': row['status']
        }
        # If analytics exist, use them; otherwise generate sample analytics for executed campaigns
        if row['emails_sent'] is not None:
            campaign['analytics'] = {
                'emailsSent': row['emails_sent'],
                'emailsOpened': row['emails_opened'],
                'replies': row['replies'],
                'bounceRate': row['bounce_rate']
            }
        elif executed:
            # Generate sample analytics for executed campaigns without analytics
            campaign['analytics'] = generate_sample_analytics(row['id'])
        campaigns.append(campaign)
    
    return campaigns

def get_campaign_analytics(campaign_id):
    """Get analytics for a specific campaign"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT c.*, 
               a.emails_sent, a.emails_opened, a.replies, a.bounce_rate
        FROM campaigns c
        LEFT JOIN analytics a ON c.id = a.campaign_id
        WHERE c.id = ?
    ''', (campaign_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    # Handle both 'paid' (old) and 'executed' (new) columns for migration
    executed = bool(row.get('executed') or row.get('paid') or False)
    
    campaign = {
        'id': row['id'],
        'name': row['name'],
        'createdAt': row['created_at'],
        'executed': executed,
        'cost': row['cost'],
        'status': row['status']
    }
    
    # If analytics exist, use them; otherwise generate sample analytics for executed campaigns
    if row['emails_sent'] is not None:
        campaign['analytics'] = {
            'emailsSent': row['emails_sent'],
            'emailsOpened': row['emails_opened'],
            'replies': row['replies'],
            'bounceRate': row['bounce_rate']
        }
    elif executed:
        # Generate sample analytics for executed campaigns without analytics
        campaign['analytics'] = generate_sample_analytics(campaign_id)
    
    return campaign

def create_campaign(campaign_id, name, cost=None):
    """Create a new campaign in the database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO campaigns (id, name, created_at, executed, cost, status)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            campaign_id,
            name,
            datetime.now().isoformat(),
            False,
            cost,
            'draft'
        ))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        # Campaign already exists, update it instead
        cursor.execute('''
            UPDATE campaigns 
            SET name = ?, cost = ?
            WHERE id = ?
        ''', (name, cost, campaign_id))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def update_campaign(campaign_id, name=None, executed=None, cost=None, status=None):
    """Update an existing campaign"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    updates = []
    values = []
    
    if name is not None:
        updates.append('name = ?')
        values.append(name)
    if executed is not None:
        updates.append('executed = ?')
        values.append(executed)
    if cost is not None:
        updates.append('cost = ?')
        values.append(cost)
    if status is not None:
        updates.append('status = ?')
        values.append(status)
    
    if not updates:
        conn.close()
        return True
    
    values.append(campaign_id)
    query = f'UPDATE campaigns SET {", ".join(updates)} WHERE id = ?'
    
    try:
        cursor.execute(query, values)
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def delete_campaign(campaign_id):
    """Delete a campaign and its analytics"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Delete analytics first (foreign key constraint)
        cursor.execute('DELETE FROM analytics WHERE campaign_id = ?', (campaign_id,))
        # Delete campaign
        cursor.execute('DELETE FROM campaigns WHERE id = ?', (campaign_id,))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def create_or_update_analytics(campaign_id, emails_sent=None, emails_opened=None, replies=None, bounce_rate=None):
    """Create or update analytics for a campaign"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if analytics exist
    cursor.execute('SELECT id FROM analytics WHERE campaign_id = ?', (campaign_id,))
    existing = cursor.fetchone()
    
    if existing:
        # Update existing analytics
        updates = []
        values = []
        
        if emails_sent is not None:
            updates.append('emails_sent = ?')
            values.append(emails_sent)
        if emails_opened is not None:
            updates.append('emails_opened = ?')
            values.append(emails_opened)
        if replies is not None:
            updates.append('replies = ?')
            values.append(replies)
        if bounce_rate is not None:
            updates.append('bounce_rate = ?')
            values.append(bounce_rate)
        
        if updates:
            updates.append('updated_at = ?')
            values.append(datetime.now().isoformat())
            values.append(campaign_id)
            
            query = f'UPDATE analytics SET {", ".join(updates)} WHERE campaign_id = ?'
            cursor.execute(query, values)
    else:
        # Create new analytics
        cursor.execute('''
            INSERT INTO analytics (campaign_id, emails_sent, emails_opened, replies, bounce_rate, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            campaign_id,
            emails_sent or 0,
            emails_opened or 0,
            replies or 0,
            bounce_rate or 0.0,
            datetime.now().isoformat()
        ))
    
    conn.commit()
    conn.close()
    return True

# Initialize database on import
init_db()
