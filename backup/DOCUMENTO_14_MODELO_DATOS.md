# DOCUMENTO 14 — MODELO DE DATOS COMPLETO

## 20 Tablas del Sistema

### 1. users
```sql
id UUID PK
email VARCHAR UNIQUE NOT NULL
password_hash VARCHAR NOT NULL
name VARCHAR NOT NULL
avatar_url VARCHAR
phone VARCHAR
status ENUM('active', 'suspended', 'banned')
email_verified BOOLEAN DEFAULT false
created_at TIMESTAMP
updated_at TIMESTAMP
last_login TIMESTAMP
```

### 2. user_roles
```sql
id UUID PK
user_id UUID FK → users
role ENUM('buyer', 'seller', 'promoter', 'affiliator', 'ong', 'admin')
assigned_at TIMESTAMP
assigned_by UUID FK → users
is_active BOOLEAN DEFAULT true
```

### 3. user_plans_history
```sql
id UUID PK
user_id UUID FK → users
plan ENUM('free', 'pro', 'premium', 'elite')
started_at TIMESTAMP
ended_at TIMESTAMP
reason VARCHAR
```

### 4. products
```sql
id UUID PK
seller_id UUID FK → users
title VARCHAR NOT NULL
description TEXT
price DECIMAL(10,2) NOT NULL
category VARCHAR
status ENUM('draft', 'active', 'paused', 'sold_out', 'deleted')
stock INTEGER DEFAULT 0
created_at TIMESTAMP
updated_at TIMESTAMP
```

### 5. product_images
```sql
id UUID PK
product_id UUID FK → products
url VARCHAR NOT NULL
position INTEGER DEFAULT 0
```

### 6. product_inventory
```sql
id UUID PK
product_id UUID FK → products
quantity INTEGER NOT NULL
operation ENUM('add', 'subtract', 'set')
reason VARCHAR
created_at TIMESTAMP
created_by UUID FK → users
```

### 7. causes
```sql
id UUID PK
ong_id UUID FK → users
title VARCHAR NOT NULL
description TEXT
image_url VARCHAR
goal_amount DECIMAL(12,2)
current_amount DECIMAL(12,2) DEFAULT 0
status ENUM('draft', 'active', 'completed', 'cancelled')
start_date TIMESTAMP
end_date TIMESTAMP
created_at TIMESTAMP
```

### 8. campaigns
```sql
id UUID PK
cause_id UUID FK → causes
name VARCHAR NOT NULL
type VARCHAR
start_date TIMESTAMP
end_date TIMESTAMP
target_amount DECIMAL(12,2)
collected_amount DECIMAL(12,2) DEFAULT 0
```

### 9. transactions
```sql
id UUID PK
buyer_id UUID FK → users
seller_id UUID FK → users
subtotal DECIMAL(10,2)
donation_amount DECIMAL(10,2)
tax_amount DECIMAL(10,2)
total_amount DECIMAL(10,2)
platform_fee DECIMAL(10,2)
seller_receives DECIMAL(10,2)
status ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')
payment_method VARCHAR
payment_reference VARCHAR
promo_code VARCHAR
promoter_id UUID FK → users
affiliator_id UUID FK → users
created_at TIMESTAMP
completed_at TIMESTAMP
```

### 10. donations
```sql
id UUID PK
transaction_id UUID FK → transactions
cause_id UUID FK → causes
donor_id UUID FK → users
amount DECIMAL(10,2) NOT NULL
percentage_applied DECIMAL(5,2)
is_anonymous BOOLEAN DEFAULT false
created_at TIMESTAMP
```

### 11. commissions
```sql
id UUID PK
transaction_id UUID FK → transactions
beneficiary_id UUID FK → users
level INTEGER NOT NULL
rate DECIMAL(5,4)
plan_multiplier DECIMAL(3,2)
amount DECIMAL(10,2) NOT NULL
status ENUM('pending', 'approved', 'paid', 'cancelled')
created_at TIMESTAMP
paid_at TIMESTAMP
```

### 12. affiliates
```sql
id UUID PK
promoter_id UUID FK → users
affiliator_id UUID FK → users
created_at TIMESTAMP
is_active BOOLEAN DEFAULT true
```

### 13. prizes
```sql
id UUID PK
creator_id UUID FK → users
title VARCHAR NOT NULL
description TEXT
image_url VARCHAR
value DECIMAL(10,2)
status ENUM('draft', 'active', 'in_raffle', 'awarded')
created_at TIMESTAMP
```

### 14. raffles
```sql
id UUID PK
prize_id UUID FK → prizes
status ENUM('active', 'closed', 'processing', 'completed')
start_date TIMESTAMP
end_date TIMESTAMP
winner_id UUID FK → users
drawn_at TIMESTAMP
created_at TIMESTAMP
```

### 15. raffle_entries
```sql
id UUID PK
user_id UUID FK → users
raffle_id UUID FK → raffles
entries_count INTEGER NOT NULL
source_transaction_id UUID FK → transactions
created_at TIMESTAMP
```

### 16. raffle_winners
```sql
id UUID PK
raffle_id UUID FK → raffles
user_id UUID FK → users
entries_at_draw INTEGER
won_at TIMESTAMP
notified_at TIMESTAMP
claimed_at TIMESTAMP
```

### 17. tracking_events
```sql
id UUID PK
event_type VARCHAR NOT NULL
actor_id UUID FK → users
target_type VARCHAR
target_id UUID
promo_code VARCHAR
ip_address INET
user_agent TEXT
metadata JSONB
created_at TIMESTAMP
```

### 18. audit_logs
```sql
id UUID PK
actor_id UUID FK → users
action VARCHAR NOT NULL
entity_type VARCHAR NOT NULL
entity_id UUID NOT NULL
old_data JSONB
new_data JSONB
ip_address INET
created_at TIMESTAMP
```

### 19. notifications
```sql
id UUID PK
user_id UUID FK → users
type VARCHAR NOT NULL
title VARCHAR NOT NULL
body TEXT
data JSONB
is_read BOOLEAN DEFAULT false
read_at TIMESTAMP
created_at TIMESTAMP
```

### 20. settings (Admin Config)
```sql
id UUID PK
key VARCHAR UNIQUE NOT NULL
value JSONB NOT NULL
category VARCHAR
description TEXT
updated_at TIMESTAMP
updated_by UUID FK → users
```

## Índices Recomendados
- users(email)
- products(seller_id, status)
- transactions(buyer_id, created_at)
- transactions(seller_id, created_at)
- commissions(beneficiary_id, status)
- donations(cause_id)
- raffle_entries(user_id, raffle_id)
- tracking_events(promo_code)
- audit_logs(actor_id, created_at)
