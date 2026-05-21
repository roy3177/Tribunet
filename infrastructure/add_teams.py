"""Seed Israeli football teams into tribunet-teams-prod."""
import boto3, uuid

table = boto3.resource('dynamodb', region_name='us-east-1').Table('tribunet-teams-prod')

TEAMS = [
    # ── ליגת העל ────────────────────────────────────────────────────────────
    { 'name': 'מכבי תל אביב',         'league': 'ליגת העל',    'city': 'תל אביב'        },
    { 'name': 'הפועל באר שבע',         'league': 'ליגת העל',    'city': 'באר שבע'        },
    { 'name': 'מכבי חיפה',             'league': 'ליגת העל',    'city': 'חיפה'           },
    { 'name': "בית\"ר ירושלים",        'league': 'ליגת העל',    'city': 'ירושלים'        },
    { 'name': 'הפועל תל אביב',         'league': 'ליגת העל',    'city': 'תל אביב'        },
    { 'name': 'מכבי נתניה',            'league': 'ליגת העל',    'city': 'נתניה'          },
    { 'name': 'הפועל חיפה',            'league': 'ליגת העל',    'city': 'חיפה'           },
    { 'name': 'מ.ס. אשדוד',            'league': 'ליגת העל',    'city': 'אשדוד'          },
    { 'name': "הפועל פתח תקווה",       'league': 'ליגת העל',    'city': 'פתח תקווה'     },
    { 'name': 'הפועל ראשון לציון',     'league': 'ליגת העל',    'city': 'ראשון לציון'    },
    { 'name': 'בני סכנין',             'league': 'ליגת העל',    'city': 'סכנין'          },
    { 'name': 'עירוני קריית שמונה',   'league': 'ליגת העל',    'city': 'קריית שמונה'    },
    { 'name': 'מכבי פתח תקווה',        'league': 'ליגת העל',    'city': 'פתח תקווה'     },
    { 'name': 'הפועל כפר שלם',         'league': 'ליגת העל',    'city': 'תל אביב'        },

    # ── ליגה לאומית ─────────────────────────────────────────────────────────
    { 'name': 'הפועל כפר סבא',         'league': 'ליגה לאומית', 'city': 'כפר סבא'        },
    { 'name': 'הפועל עפולה',           'league': 'ליגה לאומית', 'city': 'עפולה'          },
    { 'name': 'הפועל רמת גן',          'league': 'ליגה לאומית', 'city': 'רמת גן'         },
    { 'name': 'מ.ס. כפר קאסם',         'league': 'ליגה לאומית', 'city': 'כפר קאסם'      },
    { 'name': 'הפועל ירושלים',         'league': 'ליגה לאומית', 'city': 'ירושלים'        },
    { 'name': 'מכבי הרצליה',           'league': 'ליגה לאומית', 'city': 'הרצליה'         },
    { 'name': 'הפועל עכו',             'league': 'ליגה לאומית', 'city': 'עכו'            },
    { 'name': 'הפועל נוף הגליל',       'league': 'ליגה לאומית', 'city': 'נוף הגליל'      },
    { 'name': 'מכבי יבנה',             'league': 'ליגה לאומית', 'city': 'יבנה'           },
    { 'name': 'הפועל בית שאן',         'league': 'ליגה לאומית', 'city': 'בית שאן'        },
    { 'name': 'מכבי אום אל פחם',       'league': 'ליגה לאומית', 'city': "אום אל פחם"    },
    { 'name': 'הפועל רהט',             'league': 'ליגה לאומית', 'city': 'רהט'            },
]

with table.batch_writer() as batch:
    for t in TEAMS:
        item = { 'teamId': str(uuid.uuid4()), **t }
        batch.put_item(Item=item)
        print(f"  + {t['name']} ({t['league']})")

print(f'\nDone — {len(TEAMS)} teams seeded.')
