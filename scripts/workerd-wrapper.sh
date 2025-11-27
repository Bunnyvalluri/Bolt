#!/bin/bash
# Dummy workerd wrapper - prevents GLIBC 2.35 error on Vercel
# This script intercepts workerd binary calls and logs them instead of executing
echo "workerd binary execution skipped on this system (GLIBC compatibility)" >&2
exit 0
