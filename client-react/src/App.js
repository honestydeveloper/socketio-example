import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import { FeatherClient, socket } from './services/socket';

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  {
    field: 'created_at',
    headerName: 'Created at',
    width: 200,
  },
  {
    field: 'detail',
    headerName: 'Detail',
    flex: '1'
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 110,
  }
];

let isLoading = false;
export default function DataGridDemo() {
  const [rows, setRows] = useState([]);
  const rowRef = useRef(rows); // define mutable ref

  useEffect(() => { rowRef.current = rows });
  useEffect(() => {
    if (false === isLoading) {
      isLoading = true;
      FeatherClient.service('grid').find().then((result) => {
        isLoading = false;
        setRows(result);
      });
      socket.on('updateData', (result) => {
        let oldRows = JSON.parse(JSON.stringify(rowRef.current));

        // add
        let newRows = oldRows.concat(result.add);
        // updated
        for (let elem of result.updated) {
          let id = elem.id;

          newRows = newRows.map(newRow => {
            if (newRow.id == id) {
              return elem;
            } else {
              return newRow;
            }
          });
        }
        // deleted
        for (let id of result.del) {
          newRows = newRows.filter(newRow => {
            if (newRow.id == id) {
              return false;
            } else {
              return true;
            }
          });
        }

        setRows(newRows);
      });
    }
  }, [setRows]);

  return (
    <Box sx={{ height: 800, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        hideFooterPagination={true}
      />
    </Box>
  );
}