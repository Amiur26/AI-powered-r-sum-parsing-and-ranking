# backend/api/utils/file_security.py
from django.conf import settings

def scan_file(path: str):
    """
    Returns (ok: bool, status: str).
    If ENABLE_AV_SCAN is off, we skip and return True.
    If on, tries ClamAV via clamd. Any errors → block with a scan_error status.
    """
    if not settings.ENABLE_AV_SCAN:
        return True, "skipped"

    try:
        import clamd
        # Prefer a local socket if you run `clamd`. Use network socket if needed.
        try:
            cd = clamd.ClamdUnixSocket()
            pong = cd.ping()
        except Exception:
            # fallback to TCP if you run clamd in Docker or remote
            cd = clamd.ClamdNetworkSocket(host="127.0.0.1", port=3310)
            pong = cd.ping()

        if pong != "PONG":
            return False, "scan_error:no_pong"

        result = cd.scan(path)
        # result example: {'/path/to/file': ('OK', None)} or ('FOUND','Trojan.X')
        if not result:
            return False, "scan_error:no_result"

        status = list(result.values())[0][0]
        return (status == 'OK'), status
    except Exception as e:
        # If scanning is enabled but we can’t scan, be conservative and block
        return False, f"scan_error:{e}"
