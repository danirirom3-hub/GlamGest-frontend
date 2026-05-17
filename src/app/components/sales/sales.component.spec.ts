/// <reference types="jasmine" />

import { SalesComponent } from './sales.component';
import { of } from 'rxjs';

describe('SalesComponent (Prueba de Lógica Pura)', () => {
  let component: SalesComponent;

  // Declaramos los servicios simulados de forma genérica para blindar los tipos
  let mockClientsService: any;
  let mockSalesService: any;
  let mockEmployeesService: any;
  let mockServicesService: any;

  beforeEach(() => {
    // Inicializamos objetos planos con los métodos que el componente llama en el OnInit y métodos de acción
    mockClientsService = {
      getClients: () => of({ data: [] })
    };

    mockSalesService = {
      getSales: () => of({ data: [] }),
      createSale: () => of({ successful: true, message: '¡Venta procesada con éxito!' })
    };

    mockEmployeesService = {
      getEmployees: () => of({ data: [] })
    };

    mockServicesService = {
      getServices: () => of({ data: [] })
    };

    // Instanciamos el componente pasándole los mocks estructurados directamente al constructor
    // ¡Sin usar TestBed, evitando problemas con el HTML y selectores rotos!
    component = new SalesComponent(
      mockClientsService,
      mockSalesService,
      mockEmployeesService,
      mockServicesService
    );
  });

  it('debería inicializar el componente de forma correcta', () => {
    expect(component).toBeTruthy();
  });

  it('debería registrar una venta con éxito mutando sus propiedades de estado', () => {
    // 1. Cargamos datos mínimos requeridos por las estructuras de validación interna
    component.clients = [{ id: 10, name: 'Cliente Ejemplo' }];
    component.selectedClientId = 10;
    component.paymentMethod = 'Efectivo';
    
    // Seteamos el ítem simulando la asignación del empleado
    component.items = [{ serviceId: 1, employeeId: '5', quantity: 1, unitPrice: 5000, subtotal: 5000 }];

    // 2. Configuramos un espía directo sobre la función simulada para verificar llamadas futuras
    spyOn(mockSalesService, 'createSale').and.returnValue(of({ 
      successful: true, 
      message: '¡Venta procesada con éxito!' 
    }));

    // 3. Ejecutamos el método del componente
    component.registrarVenta();

    // 4. Verificaciones de control de flujo limpias
    expect(component.isLoading).toBeFalse();
    expect(component.successMessage).toBe('¡Venta procesada con éxito!');
    expect(component.errorMessage).toBe('');
    expect(mockSalesService.createSale).toHaveBeenCalled();
  });
});