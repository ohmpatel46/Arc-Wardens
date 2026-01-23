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
    except sqlite3.OperationalError:
        pass

    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            picture TEXT,
            created_at TEXT NOT NULL
        )
    ''')

    # Add user_id column to campaigns if not exists
    try:
        cursor.execute('ALTER TABLE campaigns ADD COLUMN user_id TEXT')
    except sqlite3.OperationalError:
        pass
    
    # Add contacts column to campaigns if not exists
    try:
        cursor.execute('ALTER TABLE campaigns ADD COLUMN contacts TEXT')
    except sqlite3.OperationalError:
        pass
    
    # Add tool_calls column to campaigns for workflow state
    try:
        cursor.execute('ALTER TABLE campaigns ADD COLUMN tool_calls TEXT')
    except sqlite3.OperationalError:
        pass
    
    # Add messages column to campaigns for conversation history
    try:
        cursor.execute('ALTER TABLE campaigns ADD COLUMN messages TEXT')
    except sqlite3.OperationalError:
        pass
    
    # Add pending_cost column to campaigns for payment state
    try:
        cursor.execute('ALTER TABLE campaigns ADD COLUMN pending_cost REAL DEFAULT 0')
    except sqlite3.OperationalError:
        pass
    
    # Add pending_action column to campaigns for pre-payment tool execution
    try:
        cursor.execute('ALTER TABLE campaigns ADD COLUMN pending_action TEXT')
    except sqlite3.OperationalError:
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
    
    # Create responses table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS campaign_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_id TEXT NOT NULL,
            email TEXT NOT NULL,
            response TEXT NOT NULL,
            received_at TEXT NOT NULL,
            FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
        )
    ''')
    
    conn.commit()
    conn.close()

# ... (existing functions) ...

def add_campaign_response(campaign_id, email, response):
    """Add a customer response to the database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO campaign_responses (campaign_id, email, response, received_at)
            VALUES (?, ?, ?, ?)
        ''', (campaign_id, email, response, datetime.now().isoformat()))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error adding response: {e}")
        return False
    finally:
        conn.close()

def get_campaign_responses(campaign_id):
    """Get all responses for a campaign"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM campaign_responses 
        WHERE campaign_id = ?
        ORDER BY received_at DESC
    ''', (campaign_id,))
    
    rows = cursor.fetchall()
    conn.close()
    
    responses = []
    for row in rows:
        responses.append({
            'id': row['id'],
            'campaignId': row['campaign_id'],
            'email': row['email'],
            'response': row['response'], # This maps to 'snippet' for frontend compatibility
            'snippet': row['response'],
            'receivedAt': row['received_at'],
            'subject': 'Customer Response'
        })
    return responses

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

def create_user_if_not_exists(user_data):
    """Create a user if they don't exist, otherwise update them"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO users (id, email, name, picture, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            user_data['user_id'],
            user_data['email'],
            user_data['name'],
            user_data['picture'],
            datetime.now().isoformat()
        ))
        conn.commit()
    except sqlite3.IntegrityError:
        # User exists, update info
        cursor.execute('''
            UPDATE users 
            SET name = ?, picture = ?
            WHERE id = ?
        ''', (user_data['name'], user_data['picture'], user_data['user_id']))
        conn.commit()
    finally:
        conn.close()

def get_all_campaigns(user_id):
    """Get all campaigns for a specific user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT c.*, 
               a.emails_sent, a.emails_opened, a.replies, a.bounce_rate
        FROM campaigns c
        LEFT JOIN analytics a ON c.id = a.campaign_id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
    ''', (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    campaigns = []
    for row in rows:
        row_dict = dict(row)
        executed = bool(row_dict.get('executed') or row_dict.get('paid') or False)
        
        # Parse messages from JSON if stored
        messages = []
        if row_dict.get('messages'):
            import json
            try:
                messages = json.loads(row_dict.get('messages'))
            except:
                pass
        
        campaign = {
            'id': row['id'],
            'name': row['name'],
            'createdAt': row['created_at'],
            'paid': executed,
            'executed': executed,
            'cost': row['cost'],
            'status': row['status'],
            'contacts': row_dict.get('contacts'),
            'messages': messages,  # Include conversation history
            'pendingCost': row_dict.get('pending_cost') or 0  # Include pending payment cost
        }
        if row['emails_sent'] is not None:
            campaign['analytics'] = {
                'emailsSent': row['emails_sent'],
                'emailsOpened': row['emails_opened'],
                'replies': row['replies'],
                'bounceRate': row['bounce_rate']
            }
        elif executed:
            campaign['analytics'] = generate_sample_analytics(row['id'])
        campaigns.append(campaign)
    
    return campaigns

def get_campaign_analytics(campaign_id, user_id):
    """Get analytics for a specific campaign belonging to a user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT c.*, 
               a.emails_sent, a.emails_opened, a.replies, a.bounce_rate
        FROM campaigns c
        LEFT JOIN analytics a ON c.id = a.campaign_id
        WHERE c.id = ? AND c.user_id = ?
    ''', (campaign_id, user_id))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    row_dict = dict(row)
    executed = bool(row_dict.get('executed') or row_dict.get('paid') or False)
    
    # Parse messages from JSON if stored
    messages = []
    if row_dict.get('messages'):
        import json
        try:
            messages = json.loads(row_dict.get('messages'))
        except:
            pass
    
    campaign = {
        'id': row['id'],
        'name': row['name'],
        'createdAt': row['created_at'],
        'paid': executed,
        'executed': executed,
        'cost': row['cost'],
        'status': row['status'],
        'contacts': row_dict.get('contacts'),
        'tool_calls': row_dict.get('tool_calls'),
        'messages': messages,  # Include conversation history
        'pendingCost': row_dict.get('pending_cost') or 0  # Include pending payment cost
    }
    
    if row['emails_sent'] is not None:
        campaign['analytics'] = {
            'emailsSent': row['emails_sent'],
            'emailsOpened': row['emails_opened'],
            'replies': row['replies'],
            'bounceRate': row['bounce_rate']
        }
    elif executed:
        campaign['analytics'] = generate_sample_analytics(campaign_id)
    
    return campaign

def create_campaign(campaign_id, name, user_id, cost=None):
    """Create a new campaign for a user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO campaigns (id, name, created_at, executed, cost, status, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            campaign_id,
            name,
            datetime.now().isoformat(),
            False,
            cost,
            'draft',
            user_id
        ))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        # If it exists, verify ownership before update (or assume it's fine for now)
        cursor.execute('''
            UPDATE campaigns 
            SET name = ?, cost = ?
            WHERE id = ? AND user_id = ?
        ''', (name, cost, campaign_id, user_id))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def update_campaign(campaign_id, user_id, name=None, executed=None, cost=None, status=None, contacts=None, messages=None, pending_cost=None):
    """Update an existing campaign for a user"""
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
    if contacts is not None:
        updates.append('contacts = ?')
        values.append(contacts)
    if messages is not None:
        updates.append('messages = ?')
        values.append(messages)
    if pending_cost is not None:
        updates.append('pending_cost = ?')
        values.append(pending_cost)
    
    if not updates:
        conn.close()
        return True
    
    # Add WHERE clause values
    values.append(campaign_id)
    values.append(user_id)
    
    query = f'UPDATE campaigns SET {", ".join(updates)} WHERE id = ? AND user_id = ?'
    
    try:
        cursor.execute(query, values)
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def delete_campaign(campaign_id, user_id):
    """Delete a campaign and its analytics if owned by user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check ownership first
        cursor.execute('SELECT id FROM campaigns WHERE id = ? AND user_id = ?', (campaign_id, user_id))
        if not cursor.fetchone():
            return False

        # Delete analytics first (foreign key constraint)
        cursor.execute('DELETE FROM analytics WHERE campaign_id = ?', (campaign_id,))
        # Delete campaign
        cursor.execute('DELETE FROM campaigns WHERE id = ? AND user_id = ?', (campaign_id, user_id))
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
