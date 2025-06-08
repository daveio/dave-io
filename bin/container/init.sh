#!/bin/sh

sudo apt update &&
  sudo apt -y full-upgrade &&
  sudo apt install fish

fish bin/container/setup.fish
