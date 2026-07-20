SELECT 'CREATE DATABASE futbol_predice_bi'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'futbol_predice_bi')\gexec

