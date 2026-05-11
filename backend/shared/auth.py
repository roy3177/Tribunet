import os
import json
import urllib.request
from functools import lru_cache
import jwt  # PyJWT

REGION         = os.environ.get('AWS_REGION', 'us-east-1')
USER_POOL_ID   = os.environ.get('COGNITO_USER_POOL_ID', '')
CLIENT_ID      = os.environ.get('COGNITO_CLIENT_ID', '')

JWKS_URL = (
    f"https://cognito-idp.{REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json"
)


@lru_cache(maxsize=1)
def _get_jwks() -> dict:
    with urllib.request.urlopen(JWKS_URL) as response:
        return json.loads(response.read())


def _get_public_key(kid: str):
    from jwt.algorithms import RSAAlgorithm
    jwks = _get_jwks()
    for key_data in jwks.get('keys', []):
        if key_data['kid'] == kid:
            return RSAAlgorithm.from_jwk(json.dumps(key_data))
    raise ValueError(f"Public key not found for kid: {kid}")


def verify_token(token: str) -> dict:
    """
    Validate a Cognito-issued JWT and return its decoded claims.
    Raises jwt.InvalidTokenError on failure.
    """
    unverified_header = jwt.get_unverified_header(token)
    public_key = _get_public_key(unverified_header['kid'])
    claims = jwt.decode(
        token,
        public_key,
        algorithms=['RS256'],
        audience=CLIENT_ID,
        options={'verify_exp': True},
    )
    return claims


def extract_token(event: dict) -> str | None:
    """Pull Bearer token from API Gateway event headers."""
    headers = event.get('headers') or {}
    auth_header = headers.get('Authorization') or headers.get('authorization', '')
    if auth_header.lower().startswith('bearer '):
        return auth_header[7:]
    return None


def get_claims(event: dict) -> dict:
    """
    Extract and verify the JWT from an API Gateway event.
    Returns decoded claims dict. Raises if token is missing or invalid.
    """
    token = extract_token(event)
    if not token:
        raise PermissionError('Missing Authorization header')
    return verify_token(token)


def require_admin(event: dict) -> dict:
    """Like get_claims but raises PermissionError if caller is not in Admins group."""
    claims = get_claims(event)
    groups = claims.get('cognito:groups', [])
    if 'Admins' not in groups:
        raise PermissionError('Admin access required')
    return claims
