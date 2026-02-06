import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Utility to send template-based emails via AutoSend API
 * @param {string} to - Recipient email
 * @param {string} templateId - The ID of the template from AutoSend dashboard
 * @param {object} variables - Dynamic data to fill in the template (e.g. { name: 'John' })
 */
export const sendTemplateEmail = async (to, templateId, dynamicData = {}) => {
    const API_KEY = process.env.AUTOSEND_API_KEY;
    const FROM_EMAIL = process.env.AUTOSEND_FROM_EMAIL || 'hello@launchit.site';
    const FROM_NAME = process.env.AUTOSEND_FROM_NAME || 'Launchit';

    if (!API_KEY) {
        console.error('Email Error: AUTOSEND_API_KEY is missing from .env');
        return { success: false, error: 'API Key missing' };
    }

    if (!templateId) {
        console.error('Email Error: templateId is missing');
        return { success: false, error: 'Template ID missing' };
    }

    try {
        console.log(`Email Service: Sending template ${templateId} to ${to}...`);

        const response = await axios.post('https://api.autosend.com/v1/mails/send', {
            to: {
                email: to,
                name: dynamicData.user_name || ''
            },
            from: {
                email: FROM_EMAIL,
                name: FROM_NAME
            },
            templateId,
            dynamicData
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Email Service: Success!', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Email Service Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
};

// Helper constants for template IDs (to be filled in .env)
export const EMAIL_TEMPLATES = {
    WELCOME: process.env.AUTOSEND_WELCOME_TEMPLATE_ID,
    DRAFT_REMINDER: process.env.AUTOSEND_DRAFT_REMINDER_TEMPLATE_ID,
    MILESTONE: process.env.AUTOSEND_MILESTONE_TEMPLATE_ID,
    LAUNCH_SUCCESS: process.env.AUTOSEND_LAUNCH_SUCCESS_TEMPLATE_ID,
};
