FROM python:3.12-slim-bookworm
WORKDIR /tool
COPY Tools/Migration/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY Tools/Migration/ .
USER 10001
ENTRYPOINT ["python","migrate.py"]
