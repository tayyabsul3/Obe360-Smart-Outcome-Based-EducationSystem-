const supabaseAdmin = require('../config/supabase');

async function setupStorage() {
    console.log("Setting up Supabase storage buckets and folders...");
    
    // Helper to create bucket
    const createBucket = async (bucketName) => {
        try {
            const { data, error } = await supabaseAdmin.storage.createBucket(bucketName, {
                public: true,
            });
            if (error) {
                if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
                    console.log(`Bucket '${bucketName}' already exists.`);
                } else {
                    console.error(`Error creating bucket '${bucketName}':`, error.message);
                }
            } else {
                console.log(`Bucket '${bucketName}' created successfully.`);
            }
        } catch (err) {
            console.error(`Exception creating bucket '${bucketName}':`, err.message);
        }
    };

    // Helper to create placeholder file in a folder
    const createFolderPlaceholder = async (bucketName, folderName) => {
        try {
            const filePath = `${folderName}/.placeholder`;
            const fileContent = 'Placeholder to initialize folder structure';
            
            const { error } = await supabaseAdmin.storage
                .from(bucketName)
                .upload(filePath, fileContent, {
                    contentType: 'text/plain',
                    upsert: true
                });
                
            if (error) {
                console.error(`Failed to create folder '${folderName}' in '${bucketName}':`, error.message);
            } else {
                console.log(`Initialized folder '${folderName}' in '${bucketName}'.`);
            }
        } catch (err) {
            console.error(`Exception creating folder placeholder:`, err.message);
        }
    };

    // 1. Setup buckets
    await createBucket('assessments');
    await createBucket('obe360-assets');

    // 2. Initialize folders
    await createFolderPlaceholder('obe360-assets', 'ui-auto');
    await createFolderPlaceholder('obe360-assets', 'db-storage');
    await createFolderPlaceholder('obe360-assets', 'reports');
}

module.exports = setupStorage;
