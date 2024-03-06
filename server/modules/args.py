import argparse


def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", help="yaml file", required=True)
    parser.add_argument("--fixed-stops", help="json file with predetermined stop data")
    parser.add_argument("--host", default="0.0.0.0", help="server's ip address, default is 0.0.0.0")
    parser.add_argument("--port", default="8001", help="server's port number, default is 8001", type=int)
    parser.add_argument("--verbose", '-v', action='count', default=0, help="increase logging verbosity; can be used multiple times")
    return parser.parse_args()
