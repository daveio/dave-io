#!/bin/sh

sudo apt update &&
  sudo apt -y full-upgrade &&
  sudo apt install fish

env fish bin/container/setup.fish
