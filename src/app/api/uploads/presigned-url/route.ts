import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const profile = await requireAuth();
    const { fileName, fileType } = await request.json();

    if (!fileName || !fileType) {
      return new NextResponse('File name and type are required', { status: 400 });
    }

    // Generate unique file name to prevent conflicts
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${uuidv4()}-${Date.now()}.${fileExtension}`;
    const key = `task-attachments/${profile.id}/${uniqueFileName}`;

    // Create the command for generating presigned URL
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Metadata: {
        originalName: fileName,
        uploadedBy: profile.id,
      },
    });

    // Generate presigned URL (valid for 15 minutes)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    // Construct the final file URL (public access URL)
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({
      uploadUrl: signedUrl,
      fileUrl,
      key,
    });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
