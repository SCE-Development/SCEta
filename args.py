import argparse

def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", help="yaml file", required=True)
    return parser.parse_args()
