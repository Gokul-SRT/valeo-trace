import { ModuleRegistry } from 'ag-grid-community';

import {
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  ValidationModule,
  TextEditorModule,
  PaginationModule,
  CustomEditorModule,
  SelectEditorModule,
  CsvExportModule, 
} from 'ag-grid-community';

// Register necessary AG Grid modules globally
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  ValidationModule,
  TextEditorModule,
  PaginationModule,
  CustomEditorModule,
  SelectEditorModule,
  CsvExportModule ,
]);