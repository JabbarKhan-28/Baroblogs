import { EMAILJS_CONFIG } from '@/constants/emailConfig';
import { db } from '@/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

interface EmailData {
  to_name: string;
  to_email: string;
  blog_title: string;
  blog_summary: string;
  blog_link: string; // Deep link or PDF URL
}


export const sendNewsletterEmail = async (blogPost: { title: string; summary: string; pdfPath: string; id: string }) => {
  try {
    const { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY } = EMAILJS_CONFIG;

    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      console.warn('EmailJS configuration missing. Skipping email.');
      return { success: 0, failed: 0, total: 0, error: 'Configuration missing' };
    }

    const subscribersRef = collection(db, 'subscribers');
    const subscribersSnapshot = await getDocs(subscribersRef);
    const subscribers = subscribersSnapshot.docs.map(doc => doc.data());

    if (subscribers.length === 0) {
      console.log('No subscribers to send email to.');
      return { success: 0, failed: 0, total: 0, error: 'No subscribers found' };
    }

    console.log(`Sending newsletter to ${subscribers.length} subscribers...`);

    let successCount = 0;
    let failedCount = 0;

    // Use a loop or Promise.allSettled to track individual results
    const results = await Promise.allSettled(
        subscribers.map(async (sub) => {
            const emailData = {
                service_id: SERVICE_ID,
                template_id: TEMPLATE_ID,
                user_id: PUBLIC_KEY,
                template_params: {
                    to_name: sub.name || 'Subscriber',
                    to_email: sub.email,
                    blog_title: blogPost.title,
                    blog_summary: blogPost.summary,
                    blog_link: `baroblogs://blog/${blogPost.id}`, 
                },
            };

            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData),
            });
            
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Failed to send');
            }
            return true;
        })
    );

    results.forEach((result) => {
        if (result.status === 'fulfilled') {
            successCount++;
        } else {
            console.error('Email failed:', result.reason);
            failedCount++;
        }
    });

    console.log(`Newsletter sending completed. Success: ${successCount}, Failed: ${failedCount}`);
    
    return {
        success: successCount,
        failed: failedCount,
        total: subscribers.length,
        error: null
    };

  } catch (error: any) {
    console.error('Error in sendNewsletterEmail:', error);
    return { success: 0, failed: 0, total: 0, error: error.message || 'Unknown error' };
  }
};
