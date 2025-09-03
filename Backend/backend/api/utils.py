# api/utils.py
from django.conf import settings

def audit(user, action, **meta):
    from .models import AuditEvent
    AuditEvent.objects.create(user=user, action=action, metadata=meta)

def scan_file(path: str):
    if not settings.ENABLE_AV_SCAN:
        return True, "skipped"
    try:
        import clamd
        cd = clamd.ClamdUnixSocket()
        result = cd.scan(path)
        status = list(result.values())[0][0]
        return status == 'OK', status
    except Exception as e:
        return False, f"scan_error:{e}"
