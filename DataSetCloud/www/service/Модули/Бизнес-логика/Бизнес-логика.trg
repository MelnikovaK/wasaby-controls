<?xml version="1.0" encoding="WINDOWS-1251"?>
<trigger_library version="1.02">

  <trigger last_changed="������� �.�." name="���������������" responsible="������� �.�.">
    <definition>
      <language>PLPGSQL</language>
      <body>BEGIN
IF NEW."$��������" &lt; 0 THEN
   NEW."$��������" := OLD."$��������";
ELSEIF OLD."$��������" IS NOT NULL THEN
   EXECUTE 'DELETE FROM "$��������" WHERE "���������" = $1.' || quote_ident( TG_ARGV[0] ) || ' AND "���������" = ' || TG_RELID USING OLD;
   NEW."$��������" := NULL;
END IF;
RETURN NEW;
END;</body>
    </definition>
  </trigger>

</trigger_library>
