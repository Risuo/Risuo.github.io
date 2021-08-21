"""
A sample Hello World server.
"""
import os
import urllib.request
import torch
import numpy as np
import cv2

from flask import Flask, render_template, request

from PIL import Image


import matplotlib
import matplotlib.pyplot as plt
#from skimage import io

import detectron2

from detectron2.engine import DefaultPredictor
from detectron2.config import get_cfg

from detectron2 import model_zoo

from detectron2.utils.visualizer import Visualizer
from detectron2.utils.logger import setup_logger
from detectron2.utils.visualizer import ColorMode

from detectron2.data import MetadataCatalog
from detectron2.data.datasets import register_coco_instances
from detectron2.data import build_detection_test_loader

from detectron2.evaluation import COCOEvaluator, inference_on_dataset

from google.cloud import storage


# pylint: disable=C0103
app = Flask(__name__)



@app.route('/test', methods=["GET"] )
def index():
    setup_logger()
    message = "This is the test page!"

    torch_test = (torch.__version__, torch.cuda.is_available())

    try:
        register_coco_instances("train_0", {}, "./model_json/instances_shape_train_znz_9b8638.json", "./train")
        register_coco_instances("val_0", {}, "./model_json/instances_shape_val_znz_9b8638.json", "./val")
    except:
        pass

    building_metadata = MetadataCatalog.get("train_0")

    cfg = get_cfg()
    cfg.merge_from_file(model_zoo.get_config_file("COCO-InstanceSegmentation/mask_rcnn_R_101_FPN_3x.yaml"))

    cfg.DATASETS.TRAIN = (["train_0"])
    cfg.DATASETS.VAL = (["val_0"])

    cfg.MODEL.DEVICE = 'cpu'

    cfg.DATALOADER.NUM_WORKERS = 4


    cfg.MODEL.WEIGHTS = "./model_weights/model_0003999.pth"

    cfg.MODEL.ROI_HEADS.BATCH_SIZE_PER_IMAGE = 2048

    cfg.MODEL.ROI_HEADS.NUM_CLASSES = 1
    cfg.OUTPUT_DIR = './output'

    predictor = DefaultPredictor(cfg)

    storage_client = storage.Client()

    output = []

    bucket = storage_client.get_bucket('sketcher-app-test-engine.appspot.com')

    all_blobs = list(bucket.list_blobs(prefix='satelite_screenshots/'))



    #files = list(bucket.list_blobs(prefix='/satelite_screenshots')) #working to here so far



    return render_template('index2.html',
        message=message,
        torch_test=torch_test,
        building_metadata=building_metadata,
        all_blobs=all_blobs)











@app.route('/')
def hi():
    """Return a friendly HTTP greeting."""
    message = "It's running!"
    variable2 = "This is a variable!"

    """Get Cloud Run environment variables."""
    service = os.environ.get('K_SERVICE', 'Unknown service')
    revision = os.environ.get('K_REVISION', 'Unknown revision')

    return render_template('index.html',
        message=message,
        Service=service,
        Revision=revision,
        variable2=variable2)

if __name__ == '__main__':
    server_port = os.environ.get('PORT', '8080')
    app.run(debug=False, port=server_port, host='0.0.0.0')
