from django.http import HttpRequest, HttpResponse, JsonResponse
from django.template import TemplateDoesNotExist
from django.template.response import TemplateResponse


def spa_index(request: HttpRequest) -> HttpResponse:
    """Serves the React app shell, or a clear hint if the bundle is missing."""
    try:
        return TemplateResponse(request, "index.html")
    except TemplateDoesNotExist:
        return JsonResponse(
            {
                "detail": "Frontend bundle not built.",
                "fix": "Run npm run build in frontend/, or use the Vite dev server on :5173.",
            },
            status=501,
        )
