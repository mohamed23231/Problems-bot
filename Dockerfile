FROM node:20-alpine

# Install timezone data and set default timezone to Africa/Cairo
RUN apk add --no-cache tzdata \
  && cp /usr/share/zoneinfo/Africa/Cairo /etc/localtime \
  && echo "Africa/Cairo" > /etc/timezone \
  && addgroup -S app && adduser -S app -G app

# Set working directory
WORKDIR /usr/src/app

# Environment configuration
ENV NODE_ENV=production \
    TZ=Africa/Cairo

# Install dependencies based on lockfile
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the bot source (problems + quotes + main file)
COPY . .

# Ensure application files are owned by the non-root user,
# so the bot can update problems.json inside the container
RUN chown -R app:app /usr/src/app

# Switch to non-root user
USER app

# Start the Discord bot
CMD ["npm", "start"]

