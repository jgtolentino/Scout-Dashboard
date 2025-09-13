# Base image
FROM ubuntu:22.04

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Set up environment
ENV NODE_VERSION=18.17.0
ENV PYTHON_VERSION=3.10
ENV HOME=/home/pulsedev
ENV USER=pulsedev
ENV SHELL=/bin/bash

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    wget \
    git \
    python${PYTHON_VERSION} \
    python${PYTHON_VERSION}-venv \
    python3-pip \
    vim \
    sudo \
    locales \
    dumb-init \
    ca-certificates \
    gnupg \
    libsqlite3-dev \
    netcat \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set locale
RUN locale-gen en_US.UTF-8
ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8

# Create a non-root user
RUN groupadd -r ${USER} && \
    useradd -m -r -g ${USER} -s ${SHELL} ${USER} && \
    echo "${USER} ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/${USER} && \
    chmod 0440 /etc/sudoers.d/${USER}

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g npm@10.2.4

# Create working directory
WORKDIR ${HOME}/workspace

# Create runtime directories
RUN mkdir -p ${HOME}/.cache/pip && \
    mkdir -p ${HOME}/.npm && \
    mkdir -p ${HOME}/.config && \
    chown -R ${USER}:${USER} ${HOME}

# Switch to the non-root user
USER ${USER}

# Set up Python environment
RUN python3 -m pip install --no-cache-dir --upgrade pip && \
    python3 -m pip install --no-cache-dir virtualenv

# Install common Python packages
RUN python3 -m pip install --no-cache-dir \
    pytest \
    pytest-cov \
    black \
    flake8 \
    isort \
    ipython \
    jupyter \
    matplotlib \
    pandas \
    numpy \
    requests \
    fastapi \
    uvicorn

# Install common Node.js packages
RUN mkdir -p /home/pulsedev/.npm-global && \
    chown -R pulsedev:pulsedev /home/pulsedev/.npm-global && \
    echo 'export NPM_CONFIG_PREFIX=~/.npm-global' >> /home/pulsedev/.bashrc && \
    echo 'export PATH=~/.npm-global/bin:$PATH' >> /home/pulsedev/.bashrc && \
    sudo -u pulsedev npm config set prefix '/home/pulsedev/.npm-global' && \
    sudo -u pulsedev NPM_CONFIG_PREFIX=/home/pulsedev/.npm-global npm install -g \
    typescript \
    eslint \
    prettier \
    nodemon

# Add executable runtime script
COPY --chown=${USER}:${USER} runtime.sh ${HOME}/runtime.sh
RUN chmod +x ${HOME}/runtime.sh

# Add limits script
COPY --chown=${USER}:${USER} limits.sh ${HOME}/limits.sh
RUN chmod +x ${HOME}/limits.sh

# Prepare for code execution
COPY --chown=${USER}:${USER} executor.js ${HOME}/executor.js
COPY --chown=${USER}:${USER} executor.py ${HOME}/executor.py

VOLUME ${HOME}/workspace

# Set up entrypoint
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["bash", "/home/pulsedev/runtime.sh"]