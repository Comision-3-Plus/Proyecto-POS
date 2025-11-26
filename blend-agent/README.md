# Blend Agent - Hardware Bridge

Servicio Go que actúa como puente entre la aplicación web y las impresoras fiscales conectadas por USB.

## 🚀 Características

- **Soporte Multi-Marca**: Epson y Hasar
- **API HTTP REST**: Endpoints simples para el frontend
- **Detección Automática**: Encuentra impresoras conectadas
- **Tickets Fiscales**: Impresión con validación AFIP
- **Tickets No Fiscales**: Impresión de texto libre
- **Cierre Z**: Cierre diario automático
- **Estado en Tiempo Real**: Monitoreo de papel, memoria fiscal, etc.

## 📋 Requisitos

- **Go 1.21+**
- **Windows** (para DLLs de impresoras)
- **Impresora Fiscal**: Epson TM-T20 o Hasar SMH/P-441F

## 🛠️ Instalación

### Opción 1: Binario precompilado (Recomendado)

```powershell
# Descargar instalador
Invoke-WebRequest -Uri "https://releases.nexuspos.com/blend-agent/v1.0.0/BlendAgentInstaller.msi" -OutFile "BlendAgentInstaller.msi"

# Ejecutar instalador
Start-Process msiexec.exe -ArgumentList '/i BlendAgentInstaller.msi' -Wait
```

### Opción 2: Compilar desde fuente

```powershell
# Clonar repositorio
cd blend-agent

# Instalar dependencias
go mod download

# Compilar
go build -o blend-agent.exe ./cmd/main.go

# Ejecutar
.\blend-agent.exe
```

## ⚙️ Configuración

Crear archivo `.env`:

```env
BLEND_HOST=127.0.0.1
BLEND_PORT=8080
PRINTER_TYPE=epson     # o "hasar"
PRINTER_PORT=COM1      # Puerto COM de la impresora
LOG_LEVEL=INFO
ENABLE_TLS=false
```

## 🔌 API Endpoints

### Health Check

```http
GET /health
```

Respuesta:
```json
{
  "status": "healthy",
  "service": "Blend Agent",
  "version": "1.0.0"
}
```

### Listar Impresoras

```http
GET /api/printers
```

Respuesta:
```json
{
  "printers": [
    {
      "name": "Epson TM-T20",
      "port": "COM1",
      "type": "epson",
      "status": "connected"
    }
  ],
  "count": 1
}
```

### Imprimir Ticket Fiscal

```http
POST /api/print/fiscal
Content-Type: application/json

{
  "items": [
    {
      "description": "Campera de cuero",
      "quantity": 1,
      "unit_price": 45000.00,
      "tax_rate": 21.0
    }
  ],
  "payment": {
    "method": "efectivo",
    "amount": 45000.00
  }
}
```

Respuesta:
```json
{
  "success": true,
  "message": "Ticket fiscal impreso correctamente"
}
```

### Obtener Estado de Impresora

```http
GET /api/printer/status
```

Respuesta:
```json
{
  "is_online": true,
  "paper_status": "ok",
  "fiscal_memory_used": 45.5,
  "last_document_number": 1234
}
```

### Cierre Diario (Cierre Z)

```http
POST /api/printer/daily-close
```

Respuesta:
```json
{
  "total_sales": 125000.00,
  "total_tax": 26250.00,
  "transaction_count": 47,
  "close_number": 156,
  "success": true
}
```

## 🖥️ Uso desde Frontend

```typescript
// React / Vue / Angular

const BlendAgent = {
  baseURL: 'http://localhost:8080',
  
  async printFiscalTicket(items, payment) {
    const response = await fetch(`${this.baseURL}/api/print/fiscal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, payment })
    });
    
    return response.json();
  },
  
  async getPrinterStatus() {
    const response = await fetch(`${this.baseURL}/api/printer/status`);
    return response.json();
  }
};

// Uso en checkout
const handleCheckout = async () => {
  const items = [
    { description: 'Producto 1', quantity: 2, unit_price: 1500, tax_rate: 21 }
  ];
  
  const payment = {
    method: 'efectivo',
    amount: 3000
  };
  
  const result = await BlendAgent.printFiscalTicket(items, payment);
  
  if (result.success) {
    console.log('✅ Ticket impreso');
  }
};
```

## 🔐 Seguridad

- El servicio **solo escucha en localhost** (127.0.0.1)
- No está expuesto a internet
- Solo acepta requests desde el navegador del mismo equipo
- CORS configurado para localhost:3000 (frontend)

## 📦 Instalación como Servicio Windows

```powershell
# Instalar como servicio
sc.exe create BlendAgent binPath="C:\Program Files\BlendAgent\blend-agent.exe" start=auto

# Iniciar servicio
sc.exe start BlendAgent

# Ver estado
sc.exe query BlendAgent
```

## 🐛 Troubleshooting

### Impresora no detectada

```powershell
# Verificar puerto COM
Get-WmiObject Win32_SerialPort | Select-Object Name, DeviceID

# Verificar drivers
Get-PnpDevice -Class Printer
```

### Error de DLL

Asegurarse de que las DLLs de Epson/Hasar están en:
- `C:\Program Files\BlendAgent\drivers\`
- O en el mismo directorio que `blend-agent.exe`

### Puerto en uso

```powershell
# Cambiar puerto en .env
BLEND_PORT=8081
```

## 📊 Logs

Los logs se guardan en:
- Windows: `C:\ProgramData\BlendAgent\logs\`
- Consola: `stdout` (cuando se ejecuta manualmente)

## 🏗️ Arquitectura

```
Frontend (React)
       ↓
   HTTP Request
   localhost:8080
       ↓
  Blend Agent (Go)
       ↓
   DLL Wrapper
       ↓
  Impresora Fiscal
   (USB/Serial)
```

## 📝 Notas de Producción

1. **Compilar para Windows**:
   ```bash
   GOOS=windows GOARCH=amd64 go build -o blend-agent.exe ./cmd/main.go
   ```

2. **Las DLLs de Epson/Hasar NO se incluyen** en el repositorio por copyright.
   Deben obtenerse del fabricante.

3. **Testing sin impresora física**: El código actual simula la impresora.
   Habilitar `USE_MOCK_PRINTER=true` en `.env`.

## 🤝 Soporte

- Email: support@nexuspos.com
- Discord: [Nexus POS Community](https://discord.gg/nexuspos)
- Docs: https://docs.nexuspos.com/blend-agent

## 📄 Licencia

MIT License - Ver `LICENSE` file
