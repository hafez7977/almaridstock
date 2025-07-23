import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Car, LogEntry } from '@/types/car';
import { googleSheetsService } from '@/services/googleSheets';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useGoogleSheets = () => {
  const { isAuthenticated, spreadsheetId } = useGoogleAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for stock cars
  const {
    data: stockCars = [],
    isLoading: isLoadingStock,
    error: stockError,
  } = useQuery({
    queryKey: ['stock-cars', spreadsheetId],
    queryFn: async () => {
      const rows = await googleSheetsService.readSheet(spreadsheetId, 'Stock!A:W');
      return googleSheetsService.parseCarData(rows);
    },
    enabled: isAuthenticated && !!spreadsheetId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Query for incoming cars
  const {
    data: incomingCars = [],
    isLoading: isLoadingIncoming,
    error: incomingError,
  } = useQuery({
    queryKey: ['incoming-cars', spreadsheetId],
    queryFn: async () => {
      const rows = await googleSheetsService.readSheet(spreadsheetId, 'Incoming!A:W');
      return googleSheetsService.parseCarData(rows);
    },
    enabled: isAuthenticated && !!spreadsheetId,
    refetchInterval: 30000,
  });

  // Query for KSA cars
  const {
    data: ksaCars = [],
    isLoading: isLoadingKSA,
    error: ksaError,
  } = useQuery({
    queryKey: ['ksa-cars', spreadsheetId],
    queryFn: async () => {
      const rows = await googleSheetsService.readSheet(spreadsheetId, 'KSA!A:W');
      return googleSheetsService.parseCarData(rows);
    },
    enabled: isAuthenticated && !!spreadsheetId,
    refetchInterval: 30000,
  });

  // Query for logs
  const {
    data: logs = [],
    isLoading: isLoadingLogs,
    error: logsError,
  } = useQuery({
    queryKey: ['logs', spreadsheetId],
    queryFn: async () => {
      try {
        const rows = await googleSheetsService.readSheet(spreadsheetId, 'Logs!A:E');
        return googleSheetsService.parseLogData(rows);
      } catch (error) {
        // If Logs sheet doesn't exist, create it
        await googleSheetsService.createSheet(spreadsheetId, 'Logs');
        const logRows = googleSheetsService.logToRows([]);
        await googleSheetsService.writeSheet(spreadsheetId, 'Logs!A:E', logRows);
        return [];
      }
    },
    enabled: isAuthenticated && !!spreadsheetId,
    refetchInterval: 30000,
  });

  // Mutation to update car data
  const updateCarMutation = useMutation({
    mutationFn: async ({ car, sheetName }: { car: Car; sheetName: string }) => {
      // Find the car in the current data and update the specific row
      const currentCars = 
        sheetName === 'Stock' ? stockCars :
        sheetName === 'Incoming' ? incomingCars :
        ksaCars;
      
      const carIndex = currentCars.findIndex(c => c.id === car.id);
      if (carIndex === -1) throw new Error('Car not found');

      // Update the specific row (add 2 to account for header row and 0-based indexing)
      const rowIndex = carIndex + 2;
      const carRows = googleSheetsService.carToRows([car]);
      const carData = carRows[1]; // Skip header row
      
      await googleSheetsService.writeSheet(
        spreadsheetId,
        `${sheetName}!A${rowIndex}:W${rowIndex}`,
        [carData]
      );

      return car;
    },
    onSuccess: (updatedCar, variables) => {
      // Update the cache
      queryClient.setQueryData(['stock-cars', spreadsheetId], (old: Car[] = []) =>
        variables.sheetName === 'Stock' 
          ? old.map(car => car.id === updatedCar.id ? updatedCar : car)
          : old
      );
      
      queryClient.setQueryData(['incoming-cars', spreadsheetId], (old: Car[] = []) =>
        variables.sheetName === 'Incoming' 
          ? old.map(car => car.id === updatedCar.id ? updatedCar : car)
          : old
      );
      
      queryClient.setQueryData(['ksa-cars', spreadsheetId], (old: Car[] = []) =>
        variables.sheetName === 'KSA' 
          ? old.map(car => car.id === updatedCar.id ? updatedCar : car)
          : old
      );

      toast({
        title: "Car updated successfully",
        description: `${updatedCar.name} has been updated.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating car",
        description: error instanceof Error ? error.message : 'Failed to update car',
        variant: "destructive",
      });
    },
  });

  // Mutation to add log entry
  const addLogMutation = useMutation({
    mutationFn: async (logEntry: LogEntry) => {
      await googleSheetsService.addLogEntry(spreadsheetId, logEntry);
      return logEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs', spreadsheetId] });
    },
  });

  // Helper function to update car and log the change
  const updateCar = useCallback(async (car: Car, sheetName: string, oldStatus?: string) => {
    await updateCarMutation.mutateAsync({ car, sheetName });

    // Add log entry if status changed
    if (oldStatus && oldStatus !== car.status) {
      const logEntry: LogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        sn: car.sn,
        oldStatus,
        newStatus: car.status,
        changedBy: 'System User',
      };
      await addLogMutation.mutateAsync(logEntry);
    }
  }, [updateCarMutation, addLogMutation]);

  const isLoading = isLoadingStock || isLoadingIncoming || isLoadingKSA || isLoadingLogs;
  const error = stockError || incomingError || ksaError || logsError;

  return {
    stockCars,
    incomingCars,
    ksaCars,
    logs,
    isLoading,
    error,
    updateCar,
    isUpdating: updateCarMutation.isPending,
  };
};