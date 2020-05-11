import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormGroup, FormControl,FormBuilder, Validators } from '@angular/forms';
import { AdminComponent } from '../admin/admin.component';
import { EthcontractService } from 'src/app/ethcontract.service';
import { MatTableDataSource, MatPaginator } from '@angular/material';


@Component({
  selector: 'app-supplier',
  templateUrl: './supplier.component.html',
  styleUrls: ['./supplier.component.css']
})
export class SupplierComponent implements OnInit {


  form: FormGroup;
  web3: any;
  message: any;
  Contract: any;
  public supplierAddress: any;

  RawMaterials_abi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "Splr",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "Des",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "FN",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "Loc",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "Quant",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "Shpr",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "Rcvr",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "BatchID",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "Shipper",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "Manufacturer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "TransporterType",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "Status",
          "type": "uint256"
        }
      ],
      "name": "ShippmentUpdate",
      "type": "event"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "getSuppliedRawMatrials",
      "outputs": [
        {
          "internalType": "string",
          "name": "Des",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "FN",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "Loc",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "Quant",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "Shpr",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "Rcvr",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "Splr",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "getRawMatrialsStatus",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "internalType": "address",
          "name": "shpr",
          "type": "address"
        }
      ],
      "name": "pickPackage",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "internalType": "address",
          "name": "manu",
          "type": "address"
        }
      ],
      "name": "receivedPackage",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
  account = "0x0";
  balance = '0 ETH';
  amount = 0;
  name: any;
  location: any;
  role: any;
  packageCount: any;
  Roles = {
    0: "NoRole",
    1: "Supplier",
    2: "Transporter",
    3: "Manufacturer",
    4: "Wholesaler",
    5: "Distributer",
    6: "Pharma",
    7: "Role Revoked"
  }
  packageStatus = {
    0: "not yet picked from supplier",
    1: "picked for manufacturer",
    2: "delivered to manufacturer"
  }
  tablepressed = false;
  matstat = false;
  displayedColumns: string[] = [
    'description',
    'Package ID',
    'location',
    'quantity',
    'Manufacturer',
    'Transporter',
    'Supplier',
    'Status'
  ];
  columnsToDisplay: string[] = this.displayedColumns.slice();

  packageInfo = {
    Status:0
  };
  packageDetails = this.fb.group({
    description: ['', [Validators.required, Validators.maxLength(16)]],
    farmername: ['', [Validators.required, Validators.maxLength(16)]],
    location: this.fb.group({
      latitude: [''],
      longitude: ['']
    }),
    quantity: [0, [Validators.required]],
    shipper: ['', [Validators.required]],
    receiver: ['', [Validators.required]]
  });
  // dataSource: MatTableDataSource<RawMaterial>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  supplierName: any;
  supplierLocation: any;
  userRole: any;
  supplierBalance: any;
  rawMatContract: any;
  packinfo: any;
  AdminAddress: string;
  packages: any = [];
  packageID: any;
  getStatus: any;

  constructor(private ethcontractService: EthcontractService,
    private fb: FormBuilder
    ) { 
      this.form = new FormGroup({
        MAddress : new FormControl(),
        TAddress : new FormControl(),
        numUnits : new FormControl(),
        rawMatDes : new FormControl(),
        farmLoc : new FormControl()
      });
   
  }

  async ngOnInit() {
    this.web3 = await this.ethcontractService.getWeb3();
    console.log(this.web3);

    this.Contract = await this.InitContract();
    this.AdminAddress = "0xd3832DD17DB191d545cFB829A796d8Ec87245172";
    this.Contract.options.from = this.AdminAddress;

    console.log('SupplyChain contract')
    console.log(this.Contract);

    this.getSupplierDetails();

    // this.rawMatContract = await this.InitRawMatContract();
    // this.rawMatContract.options.from = this.supplierAddress;
    // console.log('Raw materials contract')
    // console.log(this.rawMatContract)
    
  }

  public async InitContract(){
    const contract = await this.ethcontractService.getContract();
    // console.log('Inside InitContract');
    // console.log('getting out of InitContract');
    return contract
  }


  // public async InitRawMatContract(){
  //   const contract = await this.ethcontractService.getRawMatContract();
  //   // console.log('Inside InitContract');
  //   // console.log('getting out of InitContract');
  //   return contract
  // }

  public async getSupplierDetails(){
    var accounts = await this.web3.eth.getAccounts();
    // console.log(accounts);
    this.supplierAddress =accounts[0];
    const info = await this.Contract.methods.getUserInfo(this.supplierAddress).call();
    var jsonres = {
        "Name": this.web3.utils.toAscii(info[0].replace(/0+\b/, "")),
        "Location": this.web3.utils.toAscii(info[1].replace(/0+\b/, "")),
        "EthAddress": info[2],
        "Role": JSON.parse(info[3])
      }
    const balwei = await this.web3.eth.getBalance(this.supplierAddress);
    this.supplierBalance = await this.web3.utils.fromWei(balwei, "ether");
    this.supplierName = jsonres.Name;
    this.supplierLocation = jsonres.Location;
    this.userRole = jsonres.Role;
  }


  onSubmit(){
    this.createPackage();
  }

  public async createPackage(){
    console.log('creating package');
    console.log(this.Contract);
    var currentdate = new Date();
    var date = currentdate.toString();
    const packinfo = await this.Contract.methods.createRawPackage(this.form.get('rawMatDes').value,date,this.form.get('farmLoc').value,this.form.get('numUnits').value,this.form.get('TAddress').value,this.form.get('MAddress').value).send({from : this.supplierAddress});
    console.log('Created package info');
    console.log(packinfo);
  }

  public async getpackageCount(){
    this.tablepressed = true;
    console.log('Getting packages count of supplier');
    this.packageCount = await this.Contract.methods.getPackagesCountS().call({from: this.supplierAddress});
    console.log(this.packageCount);
    this.getPackageInfo();
  }

  public async getPackageInfo(){
    let i: number;
    let from = 0;
    let to = this.packageCount;
    

    for (i = from; i < to; i++) {
      const packageId = await this.Contract.methods.getPackageIdByIndexS(i).call({from: this.supplierAddress});
     
      //create new intsance of RawMaterials contract for corresponding batchId
      this.rawMatContract = new this.web3.eth.Contract(this.RawMaterials_abi,packageId, {
        from: this.supplierAddress});

      //find status of package
      const statusNo = await this.rawMatContract.methods.getRawMatrialsStatus().call();
     
      //get package details
      const result = await this.rawMatContract.methods.getSuppliedRawMatrials().call({from: this.supplierAddress});
      result['Status'] = this.packageStatus[statusNo];
      result['pid'] = packageId;

      this.packages.push(result);
  }
  console.log(this.packages);
  }

  public async getrawMaterialStatus(){
    this.matstat = true;
    console.log('hula');
    console.log(this.packageID);
    this.rawMatContract = new this.web3.eth.Contract(this.RawMaterials_abi,this.packageID,{from:this.supplierAddress});
    console.log('hula2');
    console.log(this.rawMatContract);
    const statno = await this.rawMatContract.methods.getRawMatrialsStatus().call();
    console.log(statno);
    this.getStatus = this.packageStatus[statno];
    console.log(this.getStatus);
  }
  resetpackages(){
    this.packages = [];
  }


}