const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials from environment
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadSounds() {
  const musicDir = path.join(__dirname, '../music');

  // Create bucket if it doesn't exist
  console.log('Creating storage bucket...');
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('Error listing buckets:', listError);
    return;
  }

  const bucketExists = buckets.some(b => b.name === 'focus-sounds');

  if (!bucketExists) {
    const { data, error } = await supabase.storage.createBucket('focus-sounds', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });

    if (error) {
      console.error('Error creating bucket:', error);
      return;
    }
    console.log('✓ Bucket created successfully');
  } else {
    console.log('✓ Bucket already exists');
  }

  // Upload files with simpler names
  const files = [
    {
      original: '3 Hours of Gentle Night Rain, Rain Sounds for Sleeping - Dark Screen to Beat insomnia, Relax, Study [q76bMs-NwRk].mp3',
      newName: 'rain.mp3'
    },
    {
      original: 'Just Thinking...Retro Jazz [nv_2rz5BFDA].mp3',
      newName: 'lofi.mp3'
    },
    {
      original: 'Coffee Shop Ambience  Cafe Background Noise for Study, Focus  White Noise, 백색소음.mp3',
      newName: 'cafe.mp3'
    }
  ];

  console.log('\nUploading audio files...');

  for (const file of files) {
    const filePath = path.join(musicDir, file.original);

    if (!fs.existsSync(filePath)) {
      console.error(`✗ File not found: ${file.original}`);
      continue;
    }

    console.log(`Uploading ${file.newName}...`);
    const fileBuffer = fs.readFileSync(filePath);

    const { data, error } = await supabase.storage
      .from('focus-sounds')
      .upload(file.newName, fileBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (error) {
      console.error(`✗ Error uploading ${file.newName}:`, error);
    } else {
      console.log(`✓ ${file.newName} uploaded successfully`);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('focus-sounds')
        .getPublicUrl(file.newName);

      console.log(`  URL: ${urlData.publicUrl}`);
    }
  }

  console.log('\n✓ All files uploaded!');
}

uploadSounds().catch(console.error);
