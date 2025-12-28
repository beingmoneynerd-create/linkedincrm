import { Logger } from './utils/logger.js';
import { AirtableService } from './services/airtable-service.js';

class BackgroundService {
  constructor() {
    this.airtableService = new AirtableService();
    this.init();
  }

  init() {
    this.setupMessageListener();
    this.setupActionListener();
    Logger.log('Background service initialized');
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true;
    });
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'saveToAirtable':
          const result = await this.airtableService.saveToAirtable(
            request.data,
            request.config,
            request.fieldMappings
          );
          sendResponse(result);
          break;

        case 'testAirtableConnection':
          const testResult = await this.airtableService.testAirtableConnection(request.config);
          sendResponse(testResult);
          break;

        case 'testFieldMappings':
          const mappingResult = await this.airtableService.testFieldMappings(
            request.data,
            request.config,
            request.fieldMappings
          );
          sendResponse(mappingResult);
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      Logger.error('Background service error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  setupActionListener() {
    chrome.action.onClicked.addListener(async (tab) => {
      await this.openSidePanel(tab.id);
    });
  }

  async openSidePanel(tabId) {
    if (!tabId) return;

    try {
      await chrome.sidePanel.open({ tabId });
    } catch (error) {
      Logger.error('Failed to open side panel:', error);
    }
  }
}

const backgroundService = new BackgroundService();

chrome.runtime.onStartup.addListener(() => {
  Logger.log('LinkedIn to Airtable extension started');
});

chrome.runtime.onInstalled.addListener((details) => {
  Logger.log('LinkedIn to Airtable extension installed/updated', details);
});
