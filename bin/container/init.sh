#!/bin/sh

sudo apt update
sudo apt -y full-upgrade
sudo apt -y install fish

env fish bin/container/setup.fish
