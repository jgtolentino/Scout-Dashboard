#!/bin/bash
# Install requirements for Scout Raspberry Pi Client

echo "Installing Scout Raspberry Pi Client requirements..."

# Update package lists
sudo apt-get update

# Install system dependencies
sudo apt-get install -y \
    python3-pip \
    python3-dev \
    python3-opencv \
    libatlas-base-dev \
    libjasper-dev \
    libqtgui4 \
    libqt4-test \
    libportaudio2 \
    portaudio19-dev \
    python3-pyaudio

# Install Python dependencies
pip3 install --upgrade pip
pip3 install \
    opencv-python \
    numpy \
    azure-eventhub \
    pyaudio \
    sounddevice \
    whisper

echo "Installation complete!"