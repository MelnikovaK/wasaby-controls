<?xml version="1.0" encoding="WINDOWS-1251"?>
<trigger_library version="1.02">

  <trigger last_changed="����� �.�." name="���������������������������" responsible="����� �.�.">
    <definition>
      <language>PLPGSQL</language>
      <body>DECLARE
   sequence_name TEXT;
   column_name TEXT;
   violation BOOLEAN;
BEGIN
   if TG_NARGS=2 THEN
         column_name := TG_ARGV[0];
         sequence_name := TG_ARGV[1];
         EXECUTE 'select $1.' 
            || quote_ident( column_name ) || ' &gt; s.last_value from (select last_value FROM '
            || quote_ident( sequence_name ) ||' ) s' USING NEW INTO violation;
         IF violation THEN
            RAISE EXCEPTION '���������� ��������� ������������������ ��� % � ������� %', TG_OP, TG_TABLE_NAME;
         END IF;
      END IF;
   RETURN NEW;
END;</body>
    </definition>
  </trigger>

</trigger_library>
