# Use official Odoo 17 image
FROM odoo:17

# Copy your custom addons
COPY ./addons /mnt/extra-addons

# Install any additional dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     some-dependency \
#     && rm -rf /var/lib/apt/lists/*