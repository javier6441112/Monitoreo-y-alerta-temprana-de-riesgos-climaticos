FROM mcr.microsoft.com/mssql/server:2022-latest

USER root

COPY init.sh /usr/local/bin/init.sh
COPY schema.sql /docker-entrypoint-initdb.d/schema.sql

RUN chmod +x /usr/local/bin/init.sh

ENTRYPOINT ["/bin/bash", "/usr/local/bin/init.sh"]
