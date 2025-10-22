import { supabase } from './supabaseClient';
import { PLAN_PRICING } from '../types/payment';

export const invoiceService = {
  /**
   * Create an invoice for a payment
   */
  createInvoice: async (
    userId: string,
    paymentId: string,
    plan: 'solo' | 'studio' | 'brand'
  ): Promise<string> => {
    try {
      console.log('📄 Creating invoice...', { userId, paymentId, plan });

      // Get user details
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('email, gst_number, billing_address, company_name')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('❌ Error fetching user profile:', userError);
        throw new Error('Failed to fetch user profile');
      }

      // Extract name from email
      const userName = userProfile.email.split('@')[0];

      // Get plan pricing
      const pricing = PLAN_PRICING[plan];

      // Generate invoice number using database function
      const { data: invoiceNumber, error: invoiceNumError } = await supabase
        .rpc('generate_invoice_number');

      if (invoiceNumError) {
        console.error('❌ Error generating invoice number:', invoiceNumError);
        throw new Error('Failed to generate invoice number');
      }

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          user_id: userId,
          payment_id: paymentId,
          user_name: userName,
          user_email: userProfile.email,
          user_address: userProfile.billing_address,
          user_gst_number: userProfile.gst_number,
          company_name: userProfile.company_name,
          plan,
          base_amount: pricing.baseAmount,
          gst_rate: 18.00,
          gst_amount: pricing.gst,
          total_amount: pricing.totalAmount,
          invoice_date: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (invoiceError) {
        console.error('❌ Error creating invoice:', invoiceError);
        throw new Error('Failed to create invoice');
      }

      console.log('✅ Invoice created:', invoice.id);
      return invoice.id;
    } catch (error: any) {
      console.error('❌ Error in createInvoice:', error);
      throw error;
    }
  },

  /**
   * Get invoice by payment ID
   */
  getInvoiceByPaymentId: async (paymentId: string) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('payment_id', paymentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching invoice:', error);
        throw new Error('Failed to fetch invoice');
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error in getInvoiceByPaymentId:', error);
      throw error;
    }
  },

  /**
   * Get all invoices for a user
   */
  getUserInvoices: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          payment:payments(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching invoices:', error);
        throw new Error('Failed to fetch invoices');
      }

      return data || [];
    } catch (error: any) {
      console.error('❌ Error in getUserInvoices:', error);
      throw error;
    }
  },
};

