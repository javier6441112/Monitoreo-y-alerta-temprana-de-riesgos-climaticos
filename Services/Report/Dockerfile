FROM python:3.12-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz-subset0 fonts-dejavu-core && rm -rf /var/lib/apt/lists/*
COPY Services/Report/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY Services/PythonCommon ./common
COPY Services/Report/ .
RUN useradd --uid 10001 --create-home app
USER app
EXPOSE 8080
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8080","--timeout-graceful-shutdown","30"]
