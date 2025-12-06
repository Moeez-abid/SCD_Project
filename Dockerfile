# Use official Node.js LTS version
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy all source files
COPY . .

# Load environment variables
# (Optional: you can copy .env if needed, or mount as volume)
# COPY .env .env

# Expose the port your app runs on (if any)
EXPOSE 3000

# Command to run the app
CMD ["node", "main.js"]

