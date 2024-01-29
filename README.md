# https://www.PeterScottMiller.com

The above website was developed entirely from the ground up, and is deployed via Google's Cloud App. The deployment of the Building Identification page integrates Cloud Run, Firebase, and Google Cloud Platform. 

The Machine Learning image is hosted in Google Cloud Repository, and the Cloud Run is a dynamic use selection, spinning down to zero active instances based on load. Annual costs are under $1.00. For this reason, the user experience on the Building Identification page can sometimes be less than ideal. Once the compute instance has been spun up, however, response times are generally sub-60 seconds. The Detectron2 algorithm used has been modified via transfer learning to only identify buildings, and to do so via satellite imagery from anywhere in the world. Understandably, performance is somewhat varried, and as this was a personal endeavour, cost concerns were paramount at every stage. Training was done via Google Colab GPU high-ram instances, and data cleaning and preparation was done via Paperspace higher-ram instances, at a total cost of under $100. 

