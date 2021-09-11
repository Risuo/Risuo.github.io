"""
#import urllib.request
#import requests
#import base64
#import json
#from flask import render_template, send_from_directory, send_file
#import matplotlib
#import matplotlib.pyplot as plt
#from skimage import io
#from detectron2.utils.visualizer import ColorMode
#from detectron2.data import build_detection_test_loader
#from detectron2.evaluation import COCOEvaluator, inference_on_dataset
#import io
"""
#CloudRun implementation of Detectron2
import os
from flask import Flask, request
import tempfile
from google.cloud import storage

#Detectron2 Dependencies
import torch
import numpy as np
import cv2
import logging
from PIL import Image

#Imports - Detectron2
import detectron2
from detectron2.data import MetadataCatalog
from detectron2.data.datasets import register_coco_instances
from detectron2.config import get_cfg
from detectron2 import model_zoo
from detectron2.engine import DefaultPredictor, DefaultTrainer
from detectron2.utils.logger import setup_logger
from detectron2.utils.visualizer import Visualizer

setup_logger()

# pylint: disable=C0103

app = Flask(__name__)

try:
    register_coco_instances("train_0", {}, "./model_json/instances_shape_train_znz_9b8638.json", "./train")
    register_coco_instances("val_0", {}, "./model_json/instances_shape_val_znz_9b8638.json", "./val")
except:
    pass

cfg = get_cfg()

cfg.merge_from_file(model_zoo.get_config_file("COCO-InstanceSegmentation/mask_rcnn_R_101_FPN_3x.yaml"))

cfg.DATASETS.TRAIN = (["train_0"])
cfg.DATASETS.TEST = (["train_0"])
cfg.DATASETS.VAL = (["val_0"])

cfg.MODEL.DEVICE = 'cpu'
cfg.DATALOADER.NUM_WORKERS = 2
cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.20
cfg.MODEL.WEIGHTS = "./model_weights/model_0003799.pth"
cfg.MODEL.ROI_HEADS.BATCH_SIZE_PER_IMAGE = 2048
cfg.MODEL.ROI_HEADS.NUM_CLASSES = 1
cfg.OUTPUT_DIR = './output'

logger = logging.getLogger("detectron2")
logger.setLevel(logging.CRITICAL)

trainer = DefaultTrainer(cfg)
predictor = DefaultPredictor(cfg)


@app.route('/image_process', methods=["POST"])
def index():
    envelope = request.get_json()

    print(f"envelope contents: {envelope}")

    if not envelope:
        msg = "no Pub/Sub message received"
        print(f"error: {msg}")
        return f"Bad Request: {msg}", 400

    if not isinstance(envelope, dict) or "message" not in envelope:
        msg = "invalid Pub/Sub message format"
        print(f"error: {msg}")
        return f"Bad Request: {msg}", 400

    try:
        bucket_path = envelope["message"]["attributes"]["bucketId"]
        file_path = envelope["message"]["attributes"]["objectId"]

        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_path)
        blob = storage_client.bucket(bucket_path).get_blob(file_path)

        file_name = blob.name
        file_name = file_name.split('/')[-1]

        _, temp_local_filename = tempfile.mkstemp()
        _, temp_local_filename2 = tempfile.mkstemp()

        blob.download_to_filename(temp_local_filename)

        im = Image.open(temp_local_filename)
        im = np.array(im)[:, :, :3]

        outputs = predictor(im)
        v = Visualizer(im[:, :, ::-1], MetadataCatalog.get(cfg.DATASETS.TEST[0]), scale=.5)
        out = v.draw_instance_predictions(outputs["instances"].to("cpu"))

        predicted_img = out.get_image()[:, :, ::-1]

        prediction_name = f"processed_images/{file_name}.png"

        temp_local_filename2 += ".png"
        predicted_img = Image.fromarray(predicted_img, 'RGB')
        predicted_img.save(temp_local_filename2, 'png')

        blob_to_upload = bucket.blob(prediction_name)
        blob_to_upload.upload_from_filename(temp_local_filename2)

        return ("", 204)

    except Exception as e:
        print(f"error: {e}")
        return ("", 500)

"""
@app.route('/', methods=["GET"] )
def index2():
    envelope = request.get_json()
    message = "This is the test page!"

    torch_test = (torch.__version__, torch.cuda.is_available())

    storage_client = storage.Client()

    bucket_path = 'sketcher-app-test-engine.appspot.com'
    file_path = 'satelite_screenshots/s32uL4iOiXbzHBqsJFmIehrnbJa2_1' # localhost
    #file_path = 'satelite_screenshots/2Pklcd6NtlWsBWKbGgDLmzEaPv82_1' # livesite



    bucket = storage_client.bucket(bucket_path)

    blob = storage_client.bucket(bucket_path).get_blob(file_path)
    blob_url = f"https://storage.cloud.google.com/{bucket_path}/{file_path}"
    blob_uri = f"gs://{bucket_path}/{file_path}"

    file_name = blob.name
    file_name = file_name.split('/')[-1]
    _, temp_local_filename = tempfile.mkstemp()
    _, temp_local_filename2 = tempfile.mkstemp()

    blob.download_to_filename(temp_local_filename)
    out_temp = f"Image {file_name} was downloaded to {temp_local_filename}."

    im = Image.open(temp_local_filename)
    im = np.array(im)[:, :, :3]

    outputs = predictor(im)
    v = Visualizer(im[:, :, ::-1], MetadataCatalog.get(cfg.DATASETS.TEST[0]), scale=.5)
    out = v.draw_instance_predictions(outputs["instances"].to("cpu"))

    predicted_img = out.get_image()[:, :, ::-1]

    prediction_name = f"processed_images/{file_name}.png"

    temp_local_filename2 += ".png"
    predicted_img = Image.fromarray(predicted_img, 'RGB')
    predicted_img.save(temp_local_filename2, 'png')

    blob_to_upload = bucket.blob(prediction_name)

    blob_to_upload.upload_from_filename(temp_local_filename2)


@app.route('/')
def hi():
    """"""Return a friendly HTTP greeting.""""""
    message = "It's running!"
    variable2 = "This is a variable!"

    """"""Get Cloud Run environment variables.""""""
    service = os.environ.get('K_SERVICE', 'Unknown service')
    revision = os.environ.get('K_REVISION', 'Unknown revision')

    return render_template('index.html',
        message=message,
        Service=service,
        Revision=revision,
        variable2=variable2)
"""

if __name__ == "__main__":
    PORT = int(os.getenv("PORT")) if os.getenv("PORT") else 8080

    # This is used when running locally. Gunicorn is used to run the
    # application on Cloud Run. See entrypoint in Dockerfile.
    app.run(host="127.0.0.1", port=PORT, debug=True)
