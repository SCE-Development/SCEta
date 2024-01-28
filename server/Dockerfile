FROM python:3.12-slim

WORKDIR /server

RUN apt-get update

COPY requirements.txt /server

RUN pip install -r /server/requirements.txt

EXPOSE 8001

ENTRYPOINT ["python", "app.py"]
