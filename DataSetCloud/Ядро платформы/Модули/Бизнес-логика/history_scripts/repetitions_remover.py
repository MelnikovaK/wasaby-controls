#!/usr/bin/python
# -*- coding: windows-1251 -*-

#######################################################################################
import datetime
from pip.backwardcompat import raw_input
import psycopg2
#######################################################################################
#######################################################################################
#######################################################################################
host_from = ''
port_from = '5432'
db_name_from = ''
user_from = 'service_user'
password_from = raw_input("ATTENTION!!!!! Please enter something FOR SERVICE_USER!!!!!!!!!!!!!!!!!: ")
# 1 - ������� ������������� � ������������ ��������������
# 2 - �������� �������������� �� �����
# 3 - �������� �� ������ __����__�������
# 4 - ����������� ������� � ����� ����
# 5 - �������� ������ ������������� �� *_������ ���, � ���� ���� �����
#######################################################################################
#######################################################################################
#######################################################################################

#######################################################################################
db_from = psycopg2.connect( host = host_from,
                            port = port_from,
                            database = db_name_from,
                            user = user_from,
                            password = password_from )
cur_from = db_from.cursor()
cur_from.execute('set application_name = \'inside_history_cleaner\'; ')
cur_from.execute( """
select o from (
   select
      "������������" as o, COUNT( 1 ) as C
   From
      "log.������������"
   group by
      "������������"
) T
where
   c > 1 and o is not null
order by
   c desc
""" )

list_old_recs = []

for record in cur_from:
   list_old_recs.append( record[0] )

i = 0
dt = datetime.datetime.now()
for old in list_old_recs:
   print( str( len( list_old_recs ) - i ) )
   i += 1

   print( old )

   cur_from.execute( """
delete from "log.$���������"
where "@$���������" = ANY (
   (
      select
         array_agg( "@$���������" )
      from
      (
         select
            "@$���������", "������������"
         from
            "log.������������"
         where
            "������������" = '{old}'
         order by
            "@$���������"
         offset
            1
      ) T1
   )::bigint[]
) """.format( old = old ) )

   cur_from.execute( """
delete from "log.������������"
where "@$���������" = ANY (
   (
      select
         array_agg( "@$���������" )
      from
      (
         select
            "@$���������", "������������"
         from
            "log.������������"
         where
            "������������" = '{old}'
         order by
            "@$���������"
         offset
            1
      ) T1
   )::bigint[]
) """.format( old = old ) )

   cur_from.connection.commit()

   print( datetime.datetime.now() - dt )
   dt = datetime.datetime.now()

print( "\n".join( list_old_recs ) )

#######################################################################################