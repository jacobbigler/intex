#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d intex-311.us-east-1.elasticbeanstalk.com --nginx --agree-tos --email jacob.bigler03@gmail.com