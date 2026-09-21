'use strict';

const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_KEY } = require('../config/env');

/** Синглтон клиента Supabase */
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
