const supabaseAdmin = require('../config/supabase');

async function setupStorage() {
    console.log("Setting up storage...");
    try {
        const { data, error } = await supabaseAdmin
            .storage
            .createBucket('assessments', {
                public: true, // Making public for easy download for now
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            });

        if (error) {
            if (error.message.includes('already exists')) {
                console.log("Bucket 'assessments' already exists.");
            } else {
                throw error;
            }
        } else {
            console.log("Bucket 'assessments' created successfully.");
        }
    } catch (err) {
        console.error("Storage Setup Failed:", err.message);
    }
}

setupStorage();
