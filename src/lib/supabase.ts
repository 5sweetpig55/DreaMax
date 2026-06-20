import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bunumbcdivevvtjvsuvk.supabase.co';
const supabaseKey = 'sb_publishable_JIUEsQjSI-n2G5rBFeJDAA_jE48im34';

export const supabase = createClient(supabaseUrl, supabaseKey);
