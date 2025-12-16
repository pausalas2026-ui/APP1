# DOCUMENTO 14 — MODELO DE DATOS

## Diagrama de Tablas (20 Tablas)

### users
```sql
id: UUID PRIMARY KEY
email: VARCHAR UNIQUE NOT NULL
password_hash: VARCHAR NOT NULL
name: VARCHAR NOT NULL
avatar_url: VARCHAR
phone: VARCHAR
referred_by: UUID REFERENCES users(id)
referral_code: VARCHAR UNIQUE NOT NULL
plan_type: ENUM('free','pro','premium','elite') DEFAULT 'free'
plan_multiplier: DECIMAL(3,2) DEFAULT 0.05
active_cause_id: UUID REFERENCES causes(id)
email_verified: BOOLEAN DEFAULT false
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP
```

### user_roles
```sql
id: UUID PRIMARY KEY
user_id: UUID REFERENCES users(id)
role: ENUM('user','promoter','creator','cause_generator','admin')
granted_at: TIMESTAMP DEFAULT NOW()
granted_by: UUID REFERENCES users(id)
```

### user_plans_history
```sql
id: UUID PRIMARY KEY
user_id: UUID REFERENCES users(id)
plan_type: VARCHAR NOT NULL
started_at: TIMESTAMP NOT NULL
ended_at: TIMESTAMP
reason: VARCHAR
```

### causes
```sql
id: UUID PRIMARY KEY
creator_id: UUID REFERENCES users(id)
title: VARCHAR NOT NULL
description: TEXT
image_url: VARCHAR
status: ENUM('pending','active','paused','completed','cancelled')
total_raised: DECIMAL(12,2) DEFAULT 0
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP
```

### campaigns
```sql
id: UUID PRIMARY KEY
cause_id: UUID REFERENCES causes(id)
title: VARCHAR NOT NULL
description: TEXT
goal_amount: DECIMAL(12,2)
current_amount: DECIMAL(12,2) DEFAULT 0
start_date: TIMESTAMP
end_date: TIMESTAMP
status: ENUM('draft','active','completed','cancelled')
created_at: TIMESTAMP DEFAULT NOW()
```

### products
```sql
id: UUID PRIMARY KEY
creator_id: UUID REFERENCES users(id)
title: VARCHAR NOT NULL
description: TEXT
price: DECIMAL(10,2) NOT NULL
commission_total: DECIMAL(5,2) NOT NULL
commission_n2_percent: DECIMAL(5,2) DEFAULT 10
status: ENUM('draft','pending','approved','active','paused','archived')
approved_by: UUID REFERENCES users(id)
approved_at: TIMESTAMP
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP
```

### product_images
```sql
id: UUID PRIMARY KEY
product_id: UUID REFERENCES products(id)
url: VARCHAR NOT NULL
order: INTEGER DEFAULT 0
created_at: TIMESTAMP DEFAULT NOW()
```

### product_inventory
```sql
id: UUID PRIMARY KEY
product_id: UUID REFERENCES products(id)
quantity: INTEGER DEFAULT 0
reserved: INTEGER DEFAULT 0
updated_at: TIMESTAMP DEFAULT NOW()
```

### transactions
```sql
id: UUID PRIMARY KEY
type: ENUM('purchase','donation','commission','refund','fee')
buyer_id: UUID REFERENCES users(id)
seller_id: UUID REFERENCES users(id)
promoter_id: UUID REFERENCES users(id)
product_id: UUID REFERENCES products(id)
cause_id: UUID REFERENCES causes(id)
campaign_id: UUID REFERENCES campaigns(id)
amount: DECIMAL(12,2) NOT NULL
status: ENUM('pending','processing','completed','failed','refunded')
metadata: JSONB
created_at: TIMESTAMP DEFAULT NOW()
hash: VARCHAR NOT NULL
```

### donations
```sql
id: UUID PRIMARY KEY
transaction_id: UUID REFERENCES transactions(id)
donor_id: UUID REFERENCES users(id)
cause_id: UUID REFERENCES causes(id)
campaign_id: UUID REFERENCES campaigns(id)
amount: DECIMAL(12,2) NOT NULL
source: ENUM('cart','direct','commission')
created_at: TIMESTAMP DEFAULT NOW()
```

### commissions
```sql
id: UUID PRIMARY KEY
transaction_id: UUID REFERENCES transactions(id)
user_id: UUID REFERENCES users(id)
level: INTEGER NOT NULL CHECK(level IN (1,2))
gross_amount: DECIMAL(12,2) NOT NULL
plan_multiplier: DECIMAL(3,2) NOT NULL
net_amount: DECIMAL(12,2) NOT NULL
voluntary_donation: DECIMAL(12,2) DEFAULT 0
cause_id: UUID REFERENCES causes(id)
status: ENUM('pending','available','withdrawn')
created_at: TIMESTAMP DEFAULT NOW()
```

### affiliates
```sql
id: UUID PRIMARY KEY
promoter_id: UUID REFERENCES users(id)
affiliator_id: UUID REFERENCES users(id)
level: INTEGER NOT NULL CHECK(level IN (1,2))
created_at: TIMESTAMP DEFAULT NOW()
UNIQUE(promoter_id, affiliator_id)
```

### prizes
```sql
id: UUID PRIMARY KEY
creator_id: UUID REFERENCES users(id)
title: VARCHAR NOT NULL
description: TEXT
image_url: VARCHAR
value: DECIMAL(10,2)
status: ENUM('draft','pending','approved','available','assigned')
approved_by: UUID REFERENCES users(id)
created_at: TIMESTAMP DEFAULT NOW()
```

### raffles
```sql
id: UUID PRIMARY KEY
prize_id: UUID REFERENCES prizes(id)
cause_id: UUID REFERENCES causes(id)
title: VARCHAR NOT NULL
description: TEXT
donation_required: DECIMAL(10,2) DEFAULT 0
max_entries: INTEGER
start_date: TIMESTAMP
end_date: TIMESTAMP
status: ENUM('draft','pending','approved','active','closed','completed')
approved_by: UUID REFERENCES users(id)
created_at: TIMESTAMP DEFAULT NOW()
```

### raffle_entries
```sql
id: UUID PRIMARY KEY
raffle_id: UUID REFERENCES raffles(id)
user_id: UUID REFERENCES users(id)
donation_id: UUID REFERENCES donations(id)
entry_number: INTEGER NOT NULL
created_at: TIMESTAMP DEFAULT NOW()
UNIQUE(raffle_id, entry_number)
```

### raffle_winners
```sql
id: UUID PRIMARY KEY
raffle_id: UUID REFERENCES raffles(id)
user_id: UUID REFERENCES users(id)
entry_id: UUID REFERENCES raffle_entries(id)
selected_at: TIMESTAMP DEFAULT NOW()
selection_seed: VARCHAR NOT NULL
```

### tracking_events
```sql
id: UUID PRIMARY KEY
event_type: VARCHAR NOT NULL
user_id: UUID REFERENCES users(id)
target_type: VARCHAR
target_id: UUID
metadata: JSONB
created_at: TIMESTAMP DEFAULT NOW()
```

### audit_logs
```sql
id: UUID PRIMARY KEY
actor_id: UUID REFERENCES users(id)
action: VARCHAR NOT NULL
entity_type: VARCHAR NOT NULL
entity_id: UUID
old_values: JSONB
new_values: JSONB
ip_address: VARCHAR
user_agent: VARCHAR
created_at: TIMESTAMP DEFAULT NOW()
```

### notifications
```sql
id: UUID PRIMARY KEY
user_id: UUID REFERENCES users(id)
type: VARCHAR NOT NULL
title: VARCHAR NOT NULL
body: TEXT
data: JSONB
read: BOOLEAN DEFAULT false
created_at: TIMESTAMP DEFAULT NOW()
```

### settings
```sql
id: UUID PRIMARY KEY
key: VARCHAR UNIQUE NOT NULL
value: JSONB NOT NULL
description: TEXT
updated_by: UUID REFERENCES users(id)
updated_at: TIMESTAMP DEFAULT NOW()
```

## Relaciones Clave
- users.referred_by → users.id (árbol MLM)
- users.active_cause_id → causes.id
- transactions → users, products, causes (múltiples FK)
- commissions → transactions, users, causes
- commissions.level IN (1, 2) — NUNCA 3
