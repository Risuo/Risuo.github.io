# Python image to use.
FROM python:3.8

# Allow statements and log messages to immediately appear in the Cloud Run logs
ENV PYTHONUNBUFFERED True

# Set the working directory to /app
WORKDIR /app

RUN apt-get update
RUN apt install ffmpeg libsm6 libxext6 -y

# copy the requirements file used for dependencies
COPY requirements.txt ./

# Install any needed packages specified in requirements.txt
RUN pip install --trusted-host pypi.python.org -r requirements.txt


# Copy the rest of the working directory contents into the container at /app
COPY . .

# Run main.py when the container launches
#ENTRYPOINT ["python", "main.py"]
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 main:app