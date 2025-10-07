import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface OCRResult {
  merchantName?: string;
  amount?: number;
  date?: string;
  currency?: string;
  items?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
  taxAmount?: number;
  totalAmount?: number;
  confidence?: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 405
      }
    );
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Parse the request
    const contentType = req.headers.get('Content-Type') || '';
    let imageData: string;
    let fileName: string = 'receipt.jpg';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return new Response(
          JSON.stringify({ error: 'No file uploaded' }),
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }

      fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      imageData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    } else {
      // Handle base64 image
      const body = await req.json();
      if (!body.image) {
        return new Response(
          JSON.stringify({ error: 'No image data provided' }),
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }
      imageData = body.image;
      fileName = body.fileName || 'receipt.jpg';
    }

    // Here we would normally call an OCR service like Google Vision API, AWS Textract, or Azure Form Recognizer
    // For this example, we'll simulate OCR processing
    const ocrResult = await performOCR(imageData);

    // Store the original image in Supabase Storage
    const storageFileName = `${user.id}/${Date.now()}-${fileName}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('receipts')
      .upload(storageFileName, Buffer.from(imageData, 'base64'), {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (storageError) {
      console.error('Storage error:', storageError);
    }

    // Get public URL for the stored image
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(storageFileName);

    // Create expense record with OCR data
    const expenseData = {
      user_id: user.id,
      merchant_name: ocrResult.merchantName,
      amount: ocrResult.totalAmount || ocrResult.amount,
      currency: ocrResult.currency || 'PHP',
      expense_date: ocrResult.date || new Date().toISOString().split('T')[0],
      receipt_url: publicUrl,
      ocr_data: ocrResult,
      ocr_confidence: ocrResult.confidence,
      status: 'pending_review',
      created_at: new Date().toISOString()
    };

    const { data: expense, error: insertError } = await supabase
      .from('expense.expenses')
      .insert(expenseData)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create expense record',
          details: insertError.message 
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // If confidence is high enough, auto-categorize the expense
    if (ocrResult.confidence && ocrResult.confidence > 0.8) {
      await categorizeExpense(supabase, expense.id, ocrResult);
    }

    return new Response(
      JSON.stringify({
        success: true,
        expenseId: expense.id,
        receiptUrl: publicUrl,
        ocrResult: ocrResult,
        message: 'Receipt processed successfully'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 201
      }
    );

  } catch (error) {
    console.error('Error in expense-ocr function:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 500
      }
    );
  }
});

// Simulated OCR function - in production, this would call a real OCR service
async function performOCR(imageData: string): Promise<OCRResult> {
  // In a real implementation, this would call:
  // - Google Vision API
  // - AWS Textract
  // - Azure Form Recognizer
  // - Or another OCR service

  // For now, return simulated data
  const mockResults: OCRResult[] = [
    {
      merchantName: "Starbucks Coffee",
      amount: 245.00,
      date: new Date().toISOString().split('T')[0],
      currency: "PHP",
      items: [
        { description: "Caramel Macchiato", quantity: 1, unitPrice: 185.00, totalPrice: 185.00 },
        { description: "Blueberry Muffin", quantity: 1, unitPrice: 60.00, totalPrice: 60.00 }
      ],
      taxAmount: 29.40,
      totalAmount: 245.00,
      confidence: 0.92
    },
    {
      merchantName: "Grab",
      amount: 350.00,
      date: new Date().toISOString().split('T')[0],
      currency: "PHP",
      items: [
        { description: "Ride from Makati to BGC", quantity: 1, unitPrice: 350.00, totalPrice: 350.00 }
      ],
      totalAmount: 350.00,
      confidence: 0.88
    },
    {
      merchantName: "SM Supermarket",
      amount: 1250.50,
      date: new Date().toISOString().split('T')[0],
      currency: "PHP",
      items: [
        { description: "Office Supplies", quantity: 1, totalPrice: 450.00 },
        { description: "Pantry Items", quantity: 1, totalPrice: 800.50 }
      ],
      taxAmount: 150.06,
      totalAmount: 1250.50,
      confidence: 0.85
    }
  ];

  // Return a random mock result
  return mockResults[Math.floor(Math.random() * mockResults.length)];
}

// Auto-categorize expense based on merchant and items
async function categorizeExpense(supabase: any, expenseId: string, ocrResult: OCRResult) {
  let category = 'others';
  let subcategory = 'general';

  const merchantName = ocrResult.merchantName?.toLowerCase() || '';
  
  // Simple categorization rules
  if (merchantName.includes('grab') || merchantName.includes('uber') || merchantName.includes('taxi')) {
    category = 'transportation';
    subcategory = 'taxi_ride';
  } else if (merchantName.includes('starbucks') || merchantName.includes('coffee')) {
    category = 'meals';
    subcategory = 'coffee_snacks';
  } else if (merchantName.includes('restaurant') || merchantName.includes('grill')) {
    category = 'meals';
    subcategory = 'client_meeting';
  } else if (merchantName.includes('hotel') || merchantName.includes('inn')) {
    category = 'accommodation';
    subcategory = 'business_travel';
  } else if (merchantName.includes('gas') || merchantName.includes('petron') || merchantName.includes('shell')) {
    category = 'transportation';
    subcategory = 'fuel';
  }

  // Update expense with category
  await supabase
    .from('expense.expenses')
    .update({ 
      category,
      subcategory,
      auto_categorized: true 
    })
    .eq('id', expenseId);
}