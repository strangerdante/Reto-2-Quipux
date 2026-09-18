const fs = require('fs/promises');
const path = require('path');

function safeSegment(value, fallback) {
  const normalized = String(value || fallback).replace(/[^a-zA-Z0-9_-]/g, '_');
  return normalized || fallback;
}

class FileStore {
  constructor(rootDirectory) {
    this.rootDirectory = rootDirectory;
    this.locks = new Map();
  }

  path(...segments) {
    return path.join(this.rootDirectory, ...segments);
  }

  async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async ensureDirectory(directory) {
    await fs.mkdir(directory, { recursive: true });
  }

  async readJson(filePath, fallback) {
    try {
      return JSON.parse(await fs.readFile(filePath, 'utf-8'));
    } catch (error) {
      if (error.code === 'ENOENT') return fallback;
      throw error;
    }
  }

  async writeJsonAtomic(filePath, value) {
    await this.ensureDirectory(path.dirname(filePath));
    const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify(value, null, 2), 'utf-8');
    await fs.rename(temporaryPath, filePath);
  }

  async writeBuffer(filePath, content) {
    await this.ensureDirectory(path.dirname(filePath));
    await fs.writeFile(filePath, content);
  }

  async readBuffer(filePath) {
    return fs.readFile(filePath);
  }

  async readDirectory(directory) {
    try {
      return await fs.readdir(directory);
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  async stat(filePath) {
    return fs.stat(filePath);
  }

  async runExclusive(key, operation) {
    const previous = this.locks.get(key) || Promise.resolve();
    const current = previous.catch(() => undefined).then(operation);
    this.locks.set(key, current);
    return current.finally(() => {
      if (this.locks.get(key) === current) this.locks.delete(key);
    });
  }
}

module.exports = { FileStore, safeSegment };
