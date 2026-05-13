from shared import response
from shared.auth import require_admin
from shared.db import USERS_TABLE, scan_with_filter, get_item, delete_item


def main(event, context):
    method    = event['requestContext']['http']['method']
    route_key = event.get('routeKey', '')

    if method == 'OPTIONS':
        return response.options_preflight()

    try:
        if route_key == 'GET /users':
            return _get_users(event)
        else:
            return response.not_found('Route')

    except PermissionError as e:
        return response.forbidden(str(e))
    except Exception as e:
        print(f'[users] Unhandled error: {e}')
        return response.server_error()


# ── Handlers ──────────────────────────────────────────────────────────────────

def _get_users(event: dict):
    require_admin(event)
    items = scan_with_filter(USERS_TABLE)
    return response.ok(items)
